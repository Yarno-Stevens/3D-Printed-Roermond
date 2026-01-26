package nl.embediq.woocommerce.service;

import jakarta.persistence.EntityManager;
import lombok.extern.slf4j.Slf4j;
import nl.embediq.woocommerce.dto.SyncResult;
import nl.embediq.woocommerce.dto.WooCustomer;
import nl.embediq.woocommerce.entity.Customer;
import nl.embediq.woocommerce.entity.SyncStatus;
import nl.embediq.woocommerce.enums.SyncStatusEnum;
import nl.embediq.woocommerce.enums.SyncType;
import nl.embediq.woocommerce.repository.CustomerRepository;
import nl.embediq.woocommerce.repository.SyncStatusRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@Slf4j
public class CustomerSyncService {

    @Autowired
    private WooCommerceClient wooCommerceClient;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private SyncStatusRepository syncStatusRepository;

    @Autowired
    private EntityManager entityManager;

    @Value("${woocommerce.sync.rate-limit-ms}")
    private long rateLimitMs;

    @Transactional
    public SyncResult syncCustomers() {
        log.info("Starting customer sync...");

        SyncStatus syncStatus = getOrCreateSyncStatus(SyncType.CUSTOMER);
        syncStatus.setStatus(SyncStatusEnum.RUNNING);
        syncStatus.setLastAttemptedSync(LocalDateTime.now());
        syncStatus = syncStatusRepository.save(syncStatus);

        int processedCount = 0;
        int failedCount = 0;
        int page = syncStatus.getLastProcessedPage() != null
                ? syncStatus.getLastProcessedPage() + 1
                : 1;

        try {
            LocalDateTime modifiedAfter = syncStatus.getLastSuccessfulSync();

            while (true) {
                List<WooCustomer> wooCustomers =
                        wooCommerceClient.getCustomers(page, modifiedAfter);

                if (wooCustomers.isEmpty()) {
                    break;
                }

                for (WooCustomer wooCustomer : wooCustomers) {
                    try {
                        processCustomer(wooCustomer);
                        processedCount++;
                    } catch (Exception e) {
                        log.error("Failed to process customer {}",
                                wooCustomer.getId(), e);
                        failedCount++;
                        // CRITICAL: Clear session to prevent corruption cascade
                        entityManager.clear();
                    }
                }

                syncStatus.setLastProcessedPage(page);
                syncStatus.setTotalRecordsProcessed(processedCount);
                syncStatus.setFailedRecords(failedCount);
                syncStatusRepository.save(syncStatus);

                if (wooCustomers.size() < 100) {
                    break;
                }

                page++;
                Thread.sleep(rateLimitMs);
            }

            syncStatus.setStatus(SyncStatusEnum.SUCCESS);
            syncStatus.setLastSuccessfulSync(LocalDateTime.now());
            syncStatus.setLastProcessedPage(null);
            syncStatus.setErrorMessage(null);
            syncStatusRepository.save(syncStatus);

            log.info("Customer sync completed: processed={}, failed={}",
                    processedCount, failedCount);

            return new SyncResult(true, processedCount, failedCount, null);

        } catch (Exception e) {
            log.error("Customer sync failed", e);

            syncStatus.setStatus(SyncStatusEnum.FAILED);
            syncStatus.setErrorMessage(e.getMessage());
            syncStatusRepository.save(syncStatus);

            return new SyncResult(false, processedCount, failedCount, e.getMessage());
        }
    }

    @Transactional
    public void processCustomer(WooCustomer wooCustomer) {
        Customer customer = customerRepository.findByWooCommerceId(wooCustomer.getId())
                .orElse(new Customer());

        customer.setWooCommerceId(wooCustomer.getId());
        customer.setEmail(wooCustomer.getEmail());
        customer.setFirstName(wooCustomer.getFirstName());
        customer.setLastName(wooCustomer.getLastName());
        customer.setLastSyncedAt(LocalDateTime.now());

        customerRepository.save(customer);
    }

    private SyncStatus getOrCreateSyncStatus(SyncType syncType) {
        return syncStatusRepository.findBySyncType(syncType)
                .orElseGet(() -> {
                    SyncStatus status = new SyncStatus();
                    status.setSyncType(syncType);
                    status.setStatus(SyncStatusEnum.SUCCESS);
                    return status;
                });
    }
}