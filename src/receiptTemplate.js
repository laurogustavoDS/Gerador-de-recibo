// Receipt template and formatting helpers

// Helper to format currency
export const formatCurrency = (value) => {
    if (value === undefined || value === null) return '$ 0.00';
    return `$ ${Number(value).toFixed(2)}`;
};

// Helper to get current date in Portuguese format
export const getCurrentDate = () => {
    const date = new Date();
    const day = date.getDate();
    const months = [
        "janeiro", "fevereiro", "março", "abril", "maio", "junho",
        "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"
    ];
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day} de ${month} de ${year}`;
};

// Receipt HTML template
export const RECEIPT_TEMPLATE = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <style>
        body {
            font-family: 'Arial', sans-serif;
            margin: 0;
            padding: 40px;
            color: #000;
        }
        .header {
            font-size: 32px;
            font-weight: bold;
            margin-bottom: 10px;
        }
        .divider {
            border-top: 1px solid #ccc;
            margin-bottom: 20px;
        }
        .info-line {
            font-size: 14px;
            margin-bottom: 5px;
            line-height: 1.4;
        }
        .info-label {
            font-weight: bold;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
            margin-bottom: 20px;
        }
        th {
            background-color: #f0f0f0;
            padding: 15px;
            text-align: center;
            font-weight: bold;
            border: 1px solid #ccc;
        }
        td {
            padding: 15px;
            border: 1px solid #ccc;
            vertical-align: middle;
        }
        .description {
            text-align: center;
            font-weight: bold;
            width: 50%;
        }
        .value {
            text-align: center;
            width: 50%;
        }
        tr {
            height: 60px;
        }
        .footer-text {
            font-size: 14px;
            margin-top: 10px;
        }
        .total-line {
            font-weight: bold;
            margin-top: 10px;
            font-size: 14px;
        }
        .payment-condition {
            font-weight: bold;
            margin-top: 5px;
            font-size: 14px;
        }
    </style>
</head>
<body>

    <div class="header">Recibo</div>
    <div class="divider"></div>

    <div class="info-line"><span class="info-label">Recibo nº:</span> {{receiptNumber}}</div>
    <div class="info-line"><span class="info-label">Data:</span> {{date}}</div>
    <div class="info-line"><span class="info-label">Cliente:</span> {{name}}</div>

    <table>
        <thead>
            <tr>
                <th>DESCRIÇÃO</th>
                <th>VALOR</th>
            </tr>
        </thead>
        <tbody>
            {{rows}}
        </tbody>
    </table>

    <div class="footer-text">
        Confirmamos o recebimento total dos produtos/serviços <strong>Valor Total: {{total}}</strong> descritos nesse recibo.
    </div>
    
    <div class="total-line">Valor Final: {{total}}</div>
    
    <div class="payment-condition">Condições de pagamento: Binance</div>

</body>
</html>`;

/**
 * Fills the receipt template with employee data
 */
export function fillTemplate(data, receiptNumber) {
    let html = RECEIPT_TEMPLATE;

    // Basic fields
    html = html.replace('{{receiptNumber}}', receiptNumber);
    html = html.replace('{{date}}', getCurrentDate());
    html = html.replace('{{name}}', data.name || 'N/A');

    // Build table rows
    let rowsHtml = '';

    // Dias Diurnos
    if (data.diasDiurnos !== undefined && data.diasDiurnos !== null) {
        rowsHtml += `
    <tr>
        <td class="description">Dias Diurnos</td>
        <td class="value">${data.diasDiurnos}</td>
    </tr>`;
    }

    // Dias Noturnos
    if (data.diasNoturnos !== undefined && data.diasNoturnos !== null) {
        rowsHtml += `
    <tr>
        <td class="description">Dias Noturnos</td>
        <td class="value">${data.diasNoturnos}</td>
    </tr>`;
    }

    // Salário Base
    if (data.baseSalary !== undefined && data.baseSalary !== null) {
        rowsHtml += `
    <tr>
        <td class="description">Salário Base</td>
        <td class="value">${formatCurrency(data.baseSalary)}</td>
    </tr>`;
    }

    // Benefícios
    if (data.beneficios !== undefined && data.beneficios !== null && data.beneficios !== 0) {
        rowsHtml += `
    <tr>
        <td class="description">Benefícios</td>
        <td class="value">${formatCurrency(data.beneficios)}</td>
    </tr>`;
    }

    // Bônus de 5%
    if (data.bonus5 !== undefined && data.bonus5 !== null && data.bonus5 !== 0) {
        rowsHtml += `
    <tr>
        <td class="description">Bônus de 5%</td>
        <td class="value">${formatCurrency(data.bonus5)}</td>
    </tr>`;
    }

    // Descontos
    if (data.descontos !== undefined && data.descontos !== null && data.descontos !== 0) {
        rowsHtml += `
    <tr style="color: #dc2626;">
        <td class="description">Descontos</td>
        <td class="value">-${formatCurrency(data.descontos)}</td>
    </tr>`;
    }

    html = html.replace('{{rows}}', rowsHtml);

    // Use total from data
    const total = data.total || 0;
    html = html.replace(/{{total}}/g, formatCurrency(total));

    return html;
}
