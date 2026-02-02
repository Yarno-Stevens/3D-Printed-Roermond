package nl.embediq.woocommerce.repository;

import nl.embediq.woocommerce.entity.Expense;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ExpenseRepository extends JpaRepository<Expense, Long> {

    List<Expense> findByCategory(String category);

    List<Expense> findByExpenseDateBetween(LocalDateTime start, LocalDateTime end);

    @Query("SELECT DISTINCT e.category FROM Expense e ORDER BY e.category")
    List<String> findDistinctCategories();

    @Query("SELECT DISTINCT e.supplier FROM Expense e WHERE e.supplier IS NOT NULL ORDER BY e.supplier")
    List<String> findDistinctSuppliers();
}
