/**
 * @fileoverview Utilitário para exportação de dados da lista de corte no formato CSV,
 * otimizado e formatado para importação direta no CutList Optimizer e suporte ao Microsoft Excel.
 * Execução 100% Client-side utilizando APIs nativas de Web Browser.
 * 
 * @module utils/csvExporter
 */

/**
 * Exporta uma lista de peças para um arquivo no formato CSV e dispara o download automático no navegador.
 *
 * @param {Array<Object>} cuttingList - Array contendo os objetos das peças do plano de corte.
 * @param {number|string} [cuttingList[].length] - Comprimento ou altura da peça em milímetros.
 * @param {number|string} [cuttingList[].width] - Largura da peça em milímetros.
 * @param {number|string} [cuttingList[].height] - Campo alternativo para comprimento.
 * @param {number|string} [cuttingList[].quantity] - Quantidade de peças idênticas.
 * @param {number|string} [cuttingList[].qty] - Campo alternativo para quantidade.
 * @param {number|string} [cuttingList[].thickness] - Espessura do MDF em milímetros (ex: 15 ou 18).
 * @param {string} [cuttingList[].name] - Descrição ou nome identificador da peça.
 * @param {string} [cuttingList[].label] - Campo alternativo para nome da peça.
 * @param {string} [filename='plano_de_corte.csv'] - Nome desejado para o arquivo CSV baixado.
 * @returns {boolean} Retorna `true` se o download foi iniciado com sucesso, ou `false` se falhar.
 */
export function exportToCutListCSV(cuttingList, filename = 'plano_de_corte.csv') {
    if (!Array.isArray(cuttingList) || cuttingList.length === 0) {
        console.warn('[csvExporter] Tentativa de exportação abortada: A lista de corte está vazia ou é inválida.');
        return false;
    }

    // Cabeçalho compatível com a estrutura de importação do CutList Optimizer
    const headers = ['Length', 'Width', 'Qty', 'Material', 'Enabled', 'Label'];
    
    // Início das linhas do CSV
    const rows = [];
    rows.push(headers.join(','));

    for (const item of cuttingList) {
        // Leitura resiliente de comprimento e largura
        const rawLength = Number(item.length || item.height || 0);
        const rawWidth = Number(item.width || 0);

        // O CutList Optimizer exige que Length seja sempre a maior dimensão do retângulo
        const lengthVal = Math.max(rawLength, rawWidth);
        const widthVal = Math.min(rawLength, rawWidth);

        // Quantidade (Fallback padrão de 1)
        const qtyVal = Number(item.quantity || item.qty || 1);

        // Material (MDF Xmm)
        const thicknessVal = Number(item.thickness || 15);
        const materialVal = `MDF ${thicknessVal}mm`;

        // Enabled (Sempre true para ativação padrão no otimizador)
        const enabledVal = 'true';

        // Nome da peça sanitizado contra vírgulas, aspas e quebras de linha para manter a integridade do CSV
        const rawLabel = item.name || item.label || 'Peça sem nome';
        const cleanLabel = sanitizeCSVField(rawLabel);

        // Monta a linha do CSV com valores devidamente formatados
        const row = [
            lengthVal,
            widthVal,
            qtyVal,
            `"${materialVal}"`,
            enabledVal,
            `"${cleanLabel}"`
        ];

        rows.push(row.join(','));
    }

    // Adiciona o BOM (Byte Order Mark) UTF-8 (\uFEFF) para forçar o Microsoft Excel a reconhecer a codificação UTF-8 corretamente
    const csvContent = '\uFEFF' + rows.join('\r\n');

    // Criação do Blob e disparo do download via DOM temporário
    try {
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const blobUrl = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = blobUrl;
        link.setAttribute('download', sanitizeFilename(filename));
        link.style.display = 'none';

        document.body.appendChild(link);
        link.click();

        // Limpeza de recursos do DOM e revogação da URL do objeto
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 100);

        return true;
    } catch (error) {
        console.error('[csvExporter] Ocorreu um erro durante a criação do arquivo CSV:', error);
        return false;
    }
}

/**
 * Sanitiza campos textuais para evitar quebra de formatação no arquivo CSV.
 * Remove aspas duplas internas e substitui vírgulas por traços.
 *
 * @private
 * @param {string} text - Texto bruto a ser sanitizado.
 * @returns {string} Texto limpo seguro para delimitador por vírgula.
 */
function sanitizeCSVField(text) {
    if (typeof text !== 'string') {
        text = String(text || '');
    }
    return text
        .replace(/"/g, '""')       // Escapa aspas duplas duplicando-as
        .replace(/,/g, '-')        // Substitui vírgulas por traços
        .replace(/[\r\n]+/g, ' ')  // Remove quebras de linha
        .trim();
}

/**
 * Sanitiza o nome do arquivo garantindo a extensão .csv correta.
 *
 * @private
 * @param {string} name - Nome de arquivo informado.
 * @returns {string} Nome de arquivo sanitizado.
 */
function sanitizeFilename(name) {
    if (typeof name !== 'string' || !name.trim()) {
        return 'plano_de_corte.csv';
    }
    const cleanName = name.trim().replace(/[^a-zA-Z0-9_\-\.]/g, '_');
    return cleanName.toLowerCase().endsWith('.csv') ? cleanName : `${cleanName}.csv`;
}
