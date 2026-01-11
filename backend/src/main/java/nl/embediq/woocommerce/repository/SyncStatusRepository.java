package nl.embediq.woocommerce.repository;

import nl.embediq.woocommerce.entity.SyncStatus;
import nl.embediq.woocommerce.enums.SyncType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface SyncStatusRepository extends JpaRepository<SyncStatus, Long> {
    
    Optional<SyncStatus> findBySyncType(SyncType syncType);
    
    @Query("SELECT s.lastSuccessfulSync FROM SyncStatus s WHERE s.syncType = :syncType")
    Optional<LocalDateTime> findLastSuccessfulSyncTime(@Param("syncType") SyncType syncType);
}
