package nl.embediq.woocommerce.service;

import com.itextpdf.io.image.ImageDataFactory;
import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.kernel.colors.DeviceRgb;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.borders.Border;
import com.itextpdf.layout.element.*;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import com.itextpdf.layout.properties.VerticalAlignment;
import lombok.extern.slf4j.Slf4j;
import nl.embediq.woocommerce.entity.Order;
import nl.embediq.woocommerce.entity.OrderItem;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.format.DateTimeFormatter;

@Service
@Slf4j
public class PdfGeneratorService {

    @Autowired
    private ResourceLoader resourceLoader;

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("d MMMM yyyy");
    private static final BigDecimal BTW_RATE = new BigDecimal("0.21"); // 21% BTW

    // Company details
    private static final String COMPANY_NAME = "3D Printed Roermond";
    private static final String COMPANY_ADDRESS = "Schildererf 17";
    private static final String COMPANY_POSTAL = "6043 SC Roermond";
    private static final String COMPANY_PHONE = "06 5343 7563";
    private static final String COMPANY_WEBSITE = "www.3d-printed.nl";
    private static final String COMPANY_EMAIL = "info@3d-printed.nl";
    private static final String COMPANY_KVK = "KVK: 88916316";
    private static final String COMPANY_BTW = "Btw nr: NL004670134B34";
    private static final String COMPANY_IBAN = "NL60 RABO 0338 6295 64";

    public byte[] generateOrderPdf(Order order) {
        try {
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            PdfWriter writer = new PdfWriter(baos);
            PdfDocument pdf = new PdfDocument(writer);
            Document document = new Document(pdf);

            // Set margins
            document.setMargins(40, 40, 40, 40);

            // Add header with company info
            addHeader(document);

            document.add(new Paragraph("\n"));

            // Add invoice date and number
            addInvoiceInfo(document, order);

            document.add(new Paragraph("\n"));

            // Add customer info
            addCustomerInfo(document, order);

            document.add(new Paragraph("\n\n"));

            // Add items table
            addItemsTable(document, order);

            document.add(new Paragraph("\n"));

            // Add totals
            addTotals(document, order);

            document.add(new Paragraph("\n\n"));

            // Add payment instructions
            addPaymentInstructions(document, order);

            document.close();

            log.info("PDF generated successfully for order: {}", order.getOrderNumber());

            return baos.toByteArray();

        } catch (Exception e) {
            log.error("Failed to generate PDF for order: {}", order.getOrderNumber(), e);
            throw new RuntimeException("Failed to generate PDF", e);
        }
    }

    private void addHeader(Document document) {
        Table headerTable = new Table(UnitValue.createPercentArray(new float[]{1, 1}))
                .useAllAvailableWidth()
                .setBorder(Border.NO_BORDER);

        // Left side - Logo placeholder (you can add actual logo here)
        Cell leftCell = new Cell()
                .setBorder(Border.NO_BORDER)
                .setVerticalAlignment(VerticalAlignment.TOP);

        // If you have a logo, add it here:
        try {
            Resource resource = resourceLoader.getResource("classpath:static/images/Logo_3dp.png");
            Image logo = new Image(ImageDataFactory.create(resource.getInputStream().readAllBytes()));
            logo.setWidth(250);
            leftCell.add(logo);
        } catch (Exception e) {
            // Fallback to text if logo not available
            leftCell.add(new Paragraph(COMPANY_NAME)
                    .setFontSize(16)
                    .setBold()
                    .setFontColor(new DeviceRgb(255, 87, 34))); // Orange color
        }

        // Right side - Company details
        Cell rightCell = new Cell()
                .setBorder(Border.NO_BORDER)
                .setTextAlignment(TextAlignment.RIGHT)
                .setVerticalAlignment(VerticalAlignment.TOP);

        rightCell.add(new Paragraph(COMPANY_NAME).setFontSize(10).setBold());
        rightCell.add(new Paragraph(COMPANY_ADDRESS).setFontSize(9));
        rightCell.add(new Paragraph(COMPANY_POSTAL).setFontSize(9));
        rightCell.add(new Paragraph(COMPANY_PHONE).setFontSize(9));
        rightCell.add(new Paragraph(COMPANY_WEBSITE).setFontSize(9));
        rightCell.add(new Paragraph(COMPANY_EMAIL).setFontSize(9));
        rightCell.add(new Paragraph(COMPANY_KVK).setFontSize(9));
        rightCell.add(new Paragraph(COMPANY_BTW).setFontSize(9));

        headerTable.addCell(leftCell);
        headerTable.addCell(rightCell);

        document.add(headerTable);
    }

    private void addInvoiceInfo(Document document, Order order) {
        Paragraph datumParagraph = new Paragraph()
                .add(new Text("Datum: ").setFontSize(10).setBold())
                .add(new Text(order.getCreatedAt().format(DATE_FORMATTER)).setFontSize(10))
                .setMarginTop(0)
                .setMarginBottom(5)
                .setMultipliedLeading(1f);
        document.add(datumParagraph);

        Paragraph factuurnummerParagraph = new Paragraph()
                .add(new Text("Factuurnummer: ").setFontSize(10).setBold())
                .add(new Text(order.getOrderNumber()).setFontSize(10))
                .setMarginTop(0)
                .setMarginBottom(0)
                .setMultipliedLeading(1f);
        document.add(factuurnummerParagraph);
    }

    private void addCustomerInfo(Document document, Order order) {
        document.add(new Paragraph("Factuur aan:")
                .setFontSize(10)
                .setBold()
                .setMarginTop(0)
                .setMarginBottom(5)
                .setMultipliedLeading(1f));

        if (order.getCustomer() != null) {
            // Show company name if available (in bold)
            if (order.getCustomer().getCompanyName() != null && !order.getCustomer().getCompanyName().isEmpty()) {
                document.add(new Paragraph(order.getCustomer().getCompanyName())
                        .setFontSize(10)
                        .setMarginTop(0)
                        .setMarginBottom(5)
                        .setMultipliedLeading(1f));
            }

            // Show person name
            document.add(new Paragraph(
                    order.getCustomer().getFirstName() + " " + order.getCustomer().getLastName())
                    .setFontSize(10)
                    .setMarginTop(0)
                    .setMarginBottom(5)
                    .setMultipliedLeading(1f));

            // Add address if available
            if (order.getCustomer().getAddress() != null && !order.getCustomer().getAddress().isEmpty()) {
                document.add(new Paragraph(order.getCustomer().getAddress())
                        .setFontSize(10)
                        .setMarginTop(0)
                        .setMarginBottom(5)
                        .setMultipliedLeading(1f));
            }

            // Add city and postal code
            if (order.getCustomer().getPostalCode() != null || order.getCustomer().getCity() != null) {
                String cityLine = "";
                if (order.getCustomer().getPostalCode() != null && !order.getCustomer().getPostalCode().isEmpty()) {
                    cityLine = order.getCustomer().getPostalCode();
                }
                if (order.getCustomer().getCity() != null && !order.getCustomer().getCity().isEmpty()) {
                    if (!cityLine.isEmpty()) cityLine += " ";
                    cityLine += order.getCustomer().getCity();
                }
                if (!cityLine.isEmpty()) {
                    document.add(new Paragraph(cityLine)
                            .setFontSize(10)
                            .setMarginTop(0)
                            .setMarginBottom(5)
                            .setMultipliedLeading(1f));
                }
            }
        } else {
            document.add(new Paragraph("Gastbestelling")
                    .setFontSize(10)
                    .setMarginTop(0)
                    .setMarginBottom(0)
                    .setMultipliedLeading(1f));
        }
    }

    private void addItemsTable(Document document, Order order) {
        Table table = new Table(UnitValue.createPercentArray(new float[]{1, 4, 2, 2}))
                .useAllAvailableWidth();

        // Header
        table.addHeaderCell(new Cell()
                .add(new Paragraph("Aantal").setFontSize(10).setBold())
                .setBackgroundColor(ColorConstants.WHITE)
                .setBorder(Border.NO_BORDER)
                .setBorderBottom(new com.itextpdf.layout.borders.SolidBorder(ColorConstants.BLACK, 1)));

        table.addHeaderCell(new Cell()
                .add(new Paragraph("Omschrijving").setFontSize(10).setBold())
                .setBackgroundColor(ColorConstants.WHITE)
                .setBorder(Border.NO_BORDER)
                .setBorderBottom(new com.itextpdf.layout.borders.SolidBorder(ColorConstants.BLACK, 1)));

        table.addHeaderCell(new Cell()
                .add(new Paragraph("Prijs per stuk").setFontSize(10).setBold())
                .setBackgroundColor(ColorConstants.WHITE)
                .setTextAlignment(TextAlignment.RIGHT)
                .setBorder(Border.NO_BORDER)
                .setBorderBottom(new com.itextpdf.layout.borders.SolidBorder(ColorConstants.BLACK, 1)));

        table.addHeaderCell(new Cell()
                .add(new Paragraph("Regeltotaal").setFontSize(10).setBold())
                .setBackgroundColor(ColorConstants.WHITE)
                .setTextAlignment(TextAlignment.RIGHT)
                .setBorder(Border.NO_BORDER)
                .setBorderBottom(new com.itextpdf.layout.borders.SolidBorder(ColorConstants.BLACK, 1)));

        // Items
        for (OrderItem item : order.getItems()) {
            BigDecimal itemPrice = item.getTotal().divide(
                    BigDecimal.valueOf(item.getQuantity()),
                    2,
                    RoundingMode.HALF_UP
            );

            table.addCell(new Cell()
                    .add(new Paragraph(String.valueOf(item.getQuantity())).setFontSize(9))
                    .setBorder(Border.NO_BORDER)
                    .setPaddingTop(5)
                    .setPaddingBottom(5));

            // Product name with description on new line if exists
            Cell descCell = new Cell()
                    .setBorder(Border.NO_BORDER)
                    .setPaddingTop(5)
                    .setPaddingBottom(5);
            descCell.add(new Paragraph(item.getProductName()).setFontSize(9));
            // If you have a description field, add it in italic
            // descCell.add(new Paragraph(item.getDescription()).setFontSize(8).setItalic());
            table.addCell(descCell);

            table.addCell(new Cell()
                    .add(new Paragraph(formatCurrency(itemPrice)).setFontSize(9))
                    .setTextAlignment(TextAlignment.RIGHT)
                    .setBorder(Border.NO_BORDER)
                    .setPaddingTop(5)
                    .setPaddingBottom(5));

            table.addCell(new Cell()
                    .add(new Paragraph(formatCurrency(item.getTotal())).setFontSize(9))
                    .setTextAlignment(TextAlignment.RIGHT)
                    .setBorder(Border.NO_BORDER)
                    .setPaddingTop(5)
                    .setPaddingBottom(5));
        }

        document.add(table);
    }

    private void addTotals(Document document, Order order) {
        Table totalsTable = new Table(UnitValue.createPercentArray(new float[]{3, 1}))
                .useAllAvailableWidth()
                .setBorder(Border.NO_BORDER);

        // Calculate BTW
        BigDecimal totalInclBtw = order.getTotal();
        BigDecimal btwAmount = totalInclBtw.subtract(
                totalInclBtw.divide(BigDecimal.ONE.add(BTW_RATE), 2, RoundingMode.HALF_UP)
        );

        // Total incl. BTW
        totalsTable.addCell(new Cell()
                .add(new Paragraph("Totaal incl. BTW:").setFontSize(10).setBold())
                .setTextAlignment(TextAlignment.RIGHT)
                .setBorder(Border.NO_BORDER));

        totalsTable.addCell(new Cell()
                .add(new Paragraph(formatCurrency(totalInclBtw)).setFontSize(10).setBold())
                .setTextAlignment(TextAlignment.RIGHT)
                .setBorder(Border.NO_BORDER));

        // BTW amount
        totalsTable.addCell(new Cell()
                .add(new Paragraph("Waarvan 21% BTW:").setFontSize(9))
                .setTextAlignment(TextAlignment.RIGHT)
                .setBorder(Border.NO_BORDER));

        totalsTable.addCell(new Cell()
                .add(new Paragraph(formatCurrency(btwAmount)).setFontSize(9))
                .setTextAlignment(TextAlignment.RIGHT)
                .setBorder(Border.NO_BORDER));

        document.add(totalsTable);
    }

    private void addPaymentInstructions(Document document, Order order) {
        document.add(new Paragraph(
                "Te betalen op rekeningnummer \"" + COMPANY_IBAN + "\" t.n.v. " + COMPANY_NAME)
                .setFontSize(9)
                .setTextAlignment(TextAlignment.CENTER));

        document.add(new Paragraph(
                "Vermeld hierbij uw factuurnummer in de beschrijving")
                .setFontSize(9)
                .setTextAlignment(TextAlignment.CENTER));
    }

    private String formatCurrency(BigDecimal amount) {
        return String.format("€%9s", String.format("%.2f", amount)).replace("€ ", "€\u00A0\u00A0\u00A0");
    }

    private String getStatusLabel(String status) {
        return switch (status.toUpperCase()) {
            case "PENDING" -> "In Afwachting";
            case "PROCESSING" -> "In Behandeling";
            case "ON_HOLD" -> "In de Wacht";
            case "COMPLETED" -> "Voltooid";
            case "CANCELLED" -> "Geannuleerd";
            case "REFUNDED" -> "Terugbetaald";
            case "FAILED" -> "Mislukt";
            default -> status;
        };
    }
}