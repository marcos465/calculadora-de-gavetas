/**
 * @fileoverview Utilitário para exportação de listas de corte no formato CSV compatível com CutList Optimizer.
 * @module utils/csvExporter
 */

/**
 * Representa um item da lista de corte retornado pelo CuttingListEngine.
 * @typedef {Object} CuttingItem
 * @property {string} name - Nome descritivo da peça.
 * @property {number} quantity - Quantidade de peças idênticas.
 * @property {number} height - Comprimento/Altura da peça em mm.
 * @property {number} width - Largura da peça em mm.
 * @property {number} thickness - Espessura da chapa MDF em mm.
 * @property {string} [edgeBanding] - Padrão de aplicação de fita de borda.
 * @property {string} [description] - Detalhes e aplicação técnica.
 */

/**
 * Formata um valor textual para o padrão CSV, tratando aspas duplas e vírgulas internas.
 * 
 * @param {string | number} val - Valor a ser formatado.
 * @returns {string} Valor escapado para CSV.
 */
function escapeCSVField(val) {
    if (val === null || val === undefined) {
        return '""';
    }
    const str = String(val).trim();
    // Se o valor contiver aspas, vírgulas ou quebras de linha, envolve em aspas e duplica as aspas internas.
    if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
        return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
}

/**
 * Converte a lista de peças de corte em uma string CSV no formato CutList Optimizer
 * e dispara o download nativo no navegador.
 *
 * @param {CuttingItem[]} items - Array de peças gerado pelo CuttingListEngine.
 * @param {string} [filename='corte_balcao_cutlist.csv'] - Nome do arquivo para download.
 * @returns {void}
 */
export function exportToCutListCSV(items, filename = 'corte_balcao_cutlist.csv') {
    if (!Array.isArray(items) || items.length === 0) {
        console.warn('exportToCutListCSV: Nenhuma peça fornecida para exportação.');
        return;
    }

    // 1. Cabeçalho exato exigido pelo CutList Optimizer
    const headers = ['Length', 'Width', 'Qty', 'Material', 'Label', 'Enabled'];
    const rows = [headers.join(',')];

    // 2. Mapeamento e formatação de cada peça do projeto
    for (const item of items) {
        const dim1 = Number(item.height) || 0;
        const dim2 = Number(item.width) || 0;

        // CutList Spec: Length deve ser sempre a maior dimensão, e Width a menor
        const length = Math.max(dim1, dim2);
        const width = Math.min(dim1, dim2);
        const qty = item.quantity || 1;
        
        // Formata o nome do material utilizando a espessura da peça
        const material = `MDF ${item.thickness || 15}mm`;
        const label = item.name || 'Peça sem nome';
        const enabled = true;

        const row = [
            length,
            width,
            qty,
            escapeCSVField(material),
            escapeCSVField(label),
            enabled
        ];

        rows.push(row.join(','));
    }

    const csvContent = rows.join('\r\n');

    // 3. Gerador de Download NATIVO (Browser Blob)
    // Inclusão do BOM (\uFEFF) para garantir que caracteres acentuados sejam interpretados corretamente em UTF-8 no Excel/CutList.
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const downloadUrl = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = downloadUrl;
    link.setAttribute('download', filename);

    // Esconde o elemento no DOM antes do clique simulated
    link.style.display = 'none';
    document.body.appendChild(link);

    link.click();

    // Limpeza da memória do navegador e remoção do elemento
    document.body.removeChild(link);
    URL.revokeObjectURL(downloadUrl);
}
