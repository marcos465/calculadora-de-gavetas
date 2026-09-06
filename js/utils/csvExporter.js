/**
 * @fileoverview Módulo utilitário para exportação de listas de corte no formato CSV
 * compatível com o CutList Optimizer, executado 100% no lado do cliente (Client-side).
 * 
 * @module utils/csvExporter
 */

/**
 * Normaliza e sanitiza um valor de texto para inserção segura dentro de um arquivo CSV.
 * Remove quebras de linha e escapa aspas duplas de acordo com o padrão RFC 4180.
 *
 * @param {string | number} val - Valor bruto a ser sanitizado.
 * @returns {string} String limpa para inclusão nas colunas do CSV.
 */
function sanitizeCSVText(val) {
    if (val === null || val === undefined) {
        return '';
    }
    // Converte para string e substitui aspas duplas por aspas duplas duplas (" -> "")
    const str = String(val).trim().replace(/"/g, '""');
    // Remove quebras de linha para não quebrar a estrutura de linhas do CSV
    return str.replace(/[\r\n]+/g, ' ');
}

/**
 * Garante que valores numéricos sejam formatados corretamente sem vírgulas decimais,
 * mantendo o ponto como separador decimal universal exigido pelo CutList Optimizer.
 *
 * @param {number | string} value - Valor numérico a ser validado e formatado.
 * @param {number} [fallback=0] - Valor padrão caso a conversão falhe.
 * @returns {number} Número válido e positivo.
 */
function parseNumericValue(value, fallback = 0) {
    if (typeof value === 'number' && !isNaN(value)) {
        return Math.abs(value);
    }
    if (typeof value === 'string') {
        // Substitui vírgula por ponto caso venha formatado no padrão PT-BR
        const parsed = parseFloat(value.replace(',', '.'));
        return !isNaN(parsed) ? Math.abs(parsed) : fallback;
    }
    return fallback;
}

/**
 * Converte um array de peças de corte em um arquivo CSV formatado para o CutList Optimizer
 * e dispara o download automático nativo via browser (Blob).
 *
 * @param {Array<Object>} items - Lista das peças de corte a serem exportadas.
 * @param {number|string} items[].length - Comprimento da peça.
 * @param {number|string} [items[].height] - Fallback de comprimento caso length não esteja definido.
 * @param {number|string} items[].width - Largura da peça.
 * @param {number|string} [items[].quantity] - Quantidade de peças.
 * @param {number|string} [items[].qty] - Fallback de quantidade.
 * @param {string} [items[].material] - Tipo de material / MDF.
 * @param {string} [items[].name] - Nome ou etiqueta da peça (Label).
 * @param {string} [items[].label] - Fallback de nome da peça.
 * @param {string} [filename='corte_balcao_cutlist.csv'] - Nome do arquivo para download.
 * @returns {void}
 */
export function exportToCutListCSV(items, filename = 'corte_balcao_cutlist.csv') {
    // 1. Validação do parâmetro de entrada
    if (!Array.isArray(items) || items.length === 0) {
        alert('Lista de corte vazia!');
        return;
    }

    try {
        // 2. Formatação do Cabeçalho e Conteúdo (CutList Optimizer)
        const header = 'Length,Width,Qty,Material,Label,Enabled';
        const csvLines = [header];

        for (let i = 0; i < items.length; i++) {
            const item = items[i];

            // Trata propriedades alternativas para garantir flexibilidade nos modelos de dados
            const rawLength = item.length !== undefined ? item.length : item.height;
            const rawWidth = item.width;
            const rawQty = item.quantity !== undefined ? item.quantity : item.qty;

            const length = parseNumericValue(rawLength, 0);
            const width = parseNumericValue(rawWidth, 0);
            const quantity = parseNumericValue(rawQty, 1);

            const material = sanitizeCSVText(item.material || 'MDF');
            const name = sanitizeCSVText(item.name || item.label || `Peça ${i + 1}`);

            // Montagem estrita da linha segundo o requisito:
            // ${item.length},${item.width},${item.quantity},"${item.material || 'MDF'}","${item.name}",true
            const line = `${length},${width},${quantity},"${material}","${name}",true`;
            csvLines.push(line);
        }

        // 3. Unificação das linhas com \n
        const csvContent = csvLines.join('\n');

        // 4. Geração do Blob NATIVO (com BOM UTF-8 \uFEFF para garantir compatibilidade universal)
        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });

        // 5. Geração e disparo do download nativo sem back-end
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');

        a.href = url;
        a.download = filename;
        a.style.display = 'none';

        document.body.appendChild(a);
        a.click();

        // 6. Limpeza de memória e remoção do elemento no DOM
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

    } catch (error) {
        console.error('Erro ao gerar a exportação CSV da lista de corte:', error);
        alert('Ocorreu um erro ao gerar o arquivo de exportação. Verifique o console para mais detalhes.');
    }
}
