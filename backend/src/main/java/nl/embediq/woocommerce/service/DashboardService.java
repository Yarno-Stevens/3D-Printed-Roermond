package nl.embediq.woocommerce.service;

import lombok.extern.slf4j.Slf4j;
import nl.embediq.woocommerce.entity.Order;
import nl.embediq.woocommerce.enums.OrderStatus;
import nl.embediq.woocommerce.repository.CustomerRepository;
import nl.embediq.woocommerce.repository.OrderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.time.temporal.WeekFields;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Slf4j
public class DashboardService {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private CustomerRepository customerRepository;

    /**
     * Get revenue statistics for dashboard with proper filtering
     */
    public Map<String, Object> getRevenueStatistics(Integer year, String groupBy, Integer week) {
        // Validate and set defaults
        if (year == null) {
            year = LocalDate.now().getYear();
        }
        if (groupBy == null || groupBy.isEmpty()) {
            groupBy = "month";
        }

        log.info("Fetching revenue stats for year: {}, groupBy: {}, week: {}", year, groupBy, week);

        // Get all valid orders (exclude cancelled and failed)
        List<Order> allOrders = orderRepository.findAll().stream()
                .filter(o -> o.getCreatedAt() != null)
                .filter(o -> o.getStatus() == OrderStatus.COMPLETED ||
                           o.getStatus() == OrderStatus.PROCESSING ||
                           o.getStatus() == OrderStatus.ON_HOLD)
                .collect(Collectors.toList());

        log.info("Total valid orders in system: {}", allOrders.size());

        // Determine date range based on groupBy
        LocalDateTime startDate;
        LocalDateTime endDate;

        switch (groupBy.toLowerCase()) {
            case "day":
                // Last 30 days
                startDate = LocalDate.now().minusDays(29).atStartOfDay();
                endDate = LocalDate.now().atTime(23, 59, 59);
                break;

            case "week":
                if (week != null && week >= 1 && week <= 53) {
                    // Specific week of the year
                    LocalDate firstDayOfYear = LocalDate.of(year, 1, 1);
                    LocalDate weekStart = firstDayOfYear.plusWeeks(week - 1);
                    startDate = weekStart.atStartOfDay();
                    endDate = weekStart.plusDays(6).atTime(23, 59, 59);
                } else {
                    // All weeks of the year
                    startDate = LocalDate.of(year, 1, 1).atStartOfDay();
                    endDate = LocalDate.of(year, 12, 31).atTime(23, 59, 59);
                }
                break;

            case "year":
                // Last 5 years
                startDate = LocalDate.of(year - 4, 1, 1).atStartOfDay();
                endDate = LocalDate.of(year, 12, 31).atTime(23, 59, 59);
                break;

            case "month":
            default:
                // All months of specific year
                startDate = LocalDate.of(year, 1, 1).atStartOfDay();
                endDate = LocalDate.of(year, 12, 31).atTime(23, 59, 59);
                break;
        }

        // Filter orders by date range
        List<Order> filteredOrders = allOrders.stream()
                .filter(o -> !o.getCreatedAt().isBefore(startDate) && !o.getCreatedAt().isAfter(endDate))
                .collect(Collectors.toList());

        log.info("Filtered orders for date range {}-{}: {}", startDate, endDate, filteredOrders.size());

        // Calculate total revenue
        BigDecimal totalRevenue = filteredOrders.stream()
                .map(Order::getTotal)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        log.info("Total revenue calculated: {}", totalRevenue);

        // Calculate order count
        long orderCount = filteredOrders.size();

        // Calculate average order value
        BigDecimal avgOrderValue = orderCount > 0
                ? totalRevenue.divide(BigDecimal.valueOf(orderCount), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        // Group revenue by period
        Map<String, BigDecimal> revenueByPeriod = groupRevenueByPeriod(filteredOrders, groupBy, year);

        // Get available years
        List<Integer> availableYears = allOrders.stream()
                .map(o -> o.getCreatedAt().getYear())
                .distinct()
                .sorted(Comparator.reverseOrder())
                .collect(Collectors.toList());

        // Get available weeks for the selected year
        List<Integer> availableWeeks = null;
        if ("week".equals(groupBy)) {
            availableWeeks = getAvailableWeeks(year);
        }

        // Build response
        Map<String, Object> result = new HashMap<>();
        result.put("totalRevenue", totalRevenue);
        result.put("orderCount", orderCount);
        result.put("avgOrderValue", avgOrderValue);
        result.put("revenueByPeriod", revenueByPeriod);
        result.put("year", year);
        result.put("groupBy", groupBy);
        result.put("week", week);
        result.put("availableYears", availableYears);
        result.put("availableWeeks", availableWeeks);
        result.put("startDate", startDate);
        result.put("endDate", endDate);

        return result;
    }

    /**
     * Group revenue by time period
     */
    private Map<String, BigDecimal> groupRevenueByPeriod(List<Order> orders, String groupBy, Integer year) {
        Map<String, BigDecimal> result = new LinkedHashMap<>();

        switch (groupBy.toLowerCase()) {
            case "day":
                // Last 30 days
                for (int i = 29; i >= 0; i--) {
                    LocalDate date = LocalDate.now().minusDays(i);
                    LocalDateTime dayStart = date.atStartOfDay();
                    LocalDateTime dayEnd = date.atTime(23, 59, 59);

                    BigDecimal dayRevenue = orders.stream()
                            .filter(o -> !o.getCreatedAt().isBefore(dayStart) && !o.getCreatedAt().isAfter(dayEnd))
                            .map(Order::getTotal)
                            .filter(Objects::nonNull)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);

                    result.put(date.toString(), dayRevenue);
                }
                break;

            case "week":
                // All 52 weeks of the year
                WeekFields weekFields = WeekFields.of(Locale.forLanguageTag("nl"));
                LocalDate firstDayOfYear = LocalDate.of(year, 1, 1);
                LocalDate lastDayOfYear = LocalDate.of(year, 12, 31);
                int weeksInYear = (int) ChronoUnit.WEEKS.between(firstDayOfYear, lastDayOfYear) + 1;

                for (int weekNum = 1; weekNum <= Math.min(weeksInYear, 53); weekNum++) {
                    LocalDate weekStart = firstDayOfYear.plusWeeks(weekNum - 1);
                    LocalDate weekEnd = weekStart.plusDays(6);

                    // Make sure we don't go past the year
                    if (weekEnd.getYear() > year) {
                        weekEnd = lastDayOfYear;
                    }

                    LocalDateTime weekStartTime = weekStart.atStartOfDay();
                    LocalDateTime weekEndTime = weekEnd.atTime(23, 59, 59);

                    final int currentWeek = weekNum;
                    BigDecimal weekRevenue = orders.stream()
                            .filter(o -> !o.getCreatedAt().isBefore(weekStartTime) && !o.getCreatedAt().isAfter(weekEndTime))
                            .map(Order::getTotal)
                            .filter(Objects::nonNull)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);

                    result.put("Week " + weekNum, weekRevenue);
                }
                break;

            case "month":
                // All 12 months of the year
                String[] monthNames = {"Jan", "Feb", "Mrt", "Apr", "Mei", "Jun",
                                      "Jul", "Aug", "Sep", "Okt", "Nov", "Dec"};

                for (int month = 1; month <= 12; month++) {
                    LocalDate monthDate = LocalDate.of(year, month, 1);
                    LocalDateTime monthStart = monthDate.atStartOfDay();
                    LocalDateTime monthEnd = monthDate.withDayOfMonth(monthDate.lengthOfMonth()).atTime(23, 59, 59);

                    BigDecimal monthRevenue = orders.stream()
                            .filter(o -> !o.getCreatedAt().isBefore(monthStart) && !o.getCreatedAt().isAfter(monthEnd))
                            .map(Order::getTotal)
                            .filter(Objects::nonNull)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);

                    result.put(monthNames[month - 1], monthRevenue);
                }
                break;

            case "year":
                // Last 5 years
                int currentYear = LocalDate.now().getYear();
                for (int i = 4; i >= 0; i--) {
                    int y = currentYear - i;
                    LocalDateTime yearStart = LocalDateTime.of(y, 1, 1, 0, 0);
                    LocalDateTime yearEnd = LocalDateTime.of(y, 12, 31, 23, 59, 59);

                    BigDecimal yearRevenue = orders.stream()
                            .filter(o -> !o.getCreatedAt().isBefore(yearStart) && !o.getCreatedAt().isAfter(yearEnd))
                            .map(Order::getTotal)
                            .filter(Objects::nonNull)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);

                    result.put(String.valueOf(y), yearRevenue);
                }
                break;
        }

        return result;
    }

    /**
     * Get list of weeks that have data
     */
    private List<Integer> getAvailableWeeks(int year) {
        List<Integer> weeks = new ArrayList<>();
        LocalDate firstDayOfYear = LocalDate.of(year, 1, 1);
        LocalDate lastDayOfYear = LocalDate.of(year, 12, 31);
        int weeksInYear = (int) ChronoUnit.WEEKS.between(firstDayOfYear, lastDayOfYear) + 1;

        for (int i = 1; i <= Math.min(weeksInYear, 53); i++) {
            weeks.add(i);
        }

        return weeks;
    }

    /**
     * Get top customers with proper order filtering
     */
    public List<Map<String, Object>> getTopCustomers(int limit) {
        log.info("Fetching top {} customers", limit);

        return customerRepository.findAll().stream()
                .map(customer -> {
                    // Get all valid orders for this customer
                    List<Order> validOrders = customer.getOrders().stream()
                            .filter(o -> o.getStatus() == OrderStatus.COMPLETED ||
                                       o.getStatus() == OrderStatus.PROCESSING ||
                                       o.getStatus() == OrderStatus.ON_HOLD)
                            .collect(Collectors.toList());

                    if (validOrders.isEmpty()) {
                        return null;
                    }

                    // Calculate total spent
                    BigDecimal totalSpent = validOrders.stream()
                            .map(Order::getTotal)
                            .filter(Objects::nonNull)
                            .reduce(BigDecimal.ZERO, BigDecimal::add);

                    Map<String, Object> customerData = new HashMap<>();
                    customerData.put("name", customer.getFirstName() + " " + customer.getLastName());
                    customerData.put("email", customer.getEmail());
                    customerData.put("orderCount", validOrders.size());
                    customerData.put("totalSpent", totalSpent);

                    return customerData;
                })
                .filter(Objects::nonNull)
                .sorted((c1, c2) -> {
                    BigDecimal spent1 = (BigDecimal) c1.get("totalSpent");
                    BigDecimal spent2 = (BigDecimal) c2.get("totalSpent");
                    return spent2.compareTo(spent1);
                })
                .limit(limit)
                .collect(Collectors.toList());
    }
}

