package nl.embediq.woocommerce.entity;

import jakarta.persistence.*;
import lombok.Data;
import nl.embediq.woocommerce.enums.SyncStatusEnum;
import nl.embediq.woocommerce.enums.SyncType;

import java.time.LocalDateTime;

@Entity
@Table(name = "sync_status")
@Data
public class SyncStatus {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "sync_type", nullable = false, unique = true)
    private SyncType syncType;
    
    @Column(name = "last_successful_sync")
    private LocalDateTime lastSuccessfulSync;
    
    @Column(name = "last_attempted_sync")
    private LocalDateTime lastAttemptedSync;
    
    @Column(name = "last_processed_page")
    private Integer lastProcessedPage;
    
    @Column(name = "total_records_processed")
    private Integer totalRecordsProcessed;
    
    @Column(name = "failed_records")
    private Integer failedRecords;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private SyncStatusEnum status;
    
    @Column(name = "error_message", length = 1000)
    private String errorMessage;
    
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
