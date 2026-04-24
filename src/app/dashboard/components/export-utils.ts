"use client";

export type RegisterExportColumn = {
  label: string;
  align?: "left" | "center" | "right";
};

export type RegisterExportConfig = {
  filename: string;
  title: string;
  subtitle?: string;
  countLabel?: string;
  columns: RegisterExportColumn[];
  rows: Array<Array<string | number | null | undefined>>;
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");

const normalizeCell = (value: string | number | null | undefined) =>
  value === null || value === undefined ? "" : String(value);

export function downloadRegisterCsv(config: RegisterExportConfig) {
  const csvRows = [
    config.columns.map((column) => column.label),
    ...config.rows.map((row) => row.map((value) => normalizeCell(value))),
  ];

  const csvContent = csvRows
    .map((columns) =>
      columns.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(","),
    )
    .join("\n");

  const blob = new Blob([csvContent], {
    type: "text/csv;charset=utf-8;",
  });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = config.filename.endsWith(".csv")
    ? config.filename
    : `${config.filename}.csv`;
  link.click();
  window.URL.revokeObjectURL(url);
}

export function openRegisterPdf(config: RegisterExportConfig) {
  const generatedAt = new Date().toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const countLabel = config.countLabel ?? "records";
  const headerCells = config.columns
    .map(
      (column) =>
        `<th class="th align-${column.align ?? "left"}">${escapeHtml(column.label)}</th>`,
    )
    .join("");

  const bodyRows = config.rows
    .map(
      (row) =>
        `<tr>${row
          .map((value, index) => {
            const align = config.columns[index]?.align ?? "left";
            return `<td class="td align-${align}">${escapeHtml(normalizeCell(value)) || "&mdash;"}</td>`;
          })
          .join("")}</tr>`,
    )
    .join("");

  const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(config.filename.replace(/\.pdf$/i, ""))}</title>
    <style>
      :root {
        color-scheme: light;
        --bg: #f5f7fb;
        --surface: #ffffff;
        --surface-strong: #eef2ff;
        --line: #d9e1ec;
        --line-soft: #e8edf5;
        --text: #0f172a;
        --muted: #5b6780;
        --accent: #4f46e5;
        --accent-soft: rgba(79, 70, 229, 0.12);
      }

      * { box-sizing: border-box; }

      body {
        margin: 0;
        background: var(--bg);
        color: var(--text);
        font-family: "Segoe UI", "Helvetica Neue", Arial, sans-serif;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }

      .page {
        padding: 28px;
      }

      .sheet {
        background: var(--surface);
        border: 1px solid var(--line-soft);
        border-radius: 22px;
        overflow: hidden;
      }

      .hero {
        display: flex;
        justify-content: space-between;
        gap: 24px;
        padding: 28px 30px 22px;
        border-bottom: 1px solid var(--line-soft);
        background:
          radial-gradient(circle at top right, rgba(79, 70, 229, 0.10), transparent 34%),
          linear-gradient(180deg, #ffffff, #fbfcff);
      }

      .title {
        margin: 0;
        font-size: 28px;
        font-weight: 700;
        letter-spacing: -0.02em;
      }

      .subtitle {
        margin: 10px 0 0;
        max-width: 640px;
        color: var(--muted);
        font-size: 14px;
        line-height: 1.6;
      }

      .meta {
        display: grid;
        gap: 10px;
        min-width: 210px;
      }

      .pill {
        display: flex;
        justify-content: space-between;
        gap: 14px;
        padding: 12px 14px;
        border: 1px solid var(--line-soft);
        border-radius: 14px;
        background: var(--surface-strong);
        font-size: 12px;
      }

      .pill strong {
        color: var(--text);
      }

      .table-wrap {
        padding: 20px 22px 24px;
      }

      table {
        width: 100%;
        border-collapse: separate;
        border-spacing: 0;
      }

      .th {
        padding: 14px 12px;
        border-top: 1px solid var(--line);
        border-bottom: 1px solid var(--line);
        background: #f8fafc;
        color: var(--muted);
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.12em;
        text-transform: uppercase;
      }

      .th:first-child { border-left: 1px solid var(--line); border-top-left-radius: 14px; }
      .th:last-child { border-right: 1px solid var(--line); border-top-right-radius: 14px; }

      .td {
        padding: 13px 12px;
        border-bottom: 1px solid var(--line-soft);
        color: var(--text);
        font-size: 13px;
        line-height: 1.45;
        vertical-align: top;
      }

      tr .td:first-child { border-left: 1px solid var(--line-soft); }
      tr .td:last-child { border-right: 1px solid var(--line-soft); }
      tr:last-child .td:first-child { border-bottom-left-radius: 14px; }
      tr:last-child .td:last-child { border-bottom-right-radius: 14px; }

      .align-left { text-align: left; }
      .align-center { text-align: center; }
      .align-right { text-align: right; }

      .empty {
        padding: 42px 12px;
        text-align: center;
        color: var(--muted);
        font-size: 14px;
      }

      @media print {
        body { background: #ffffff; }
        .page { padding: 0; }
        .sheet { border: none; border-radius: 0; }
      }
    </style>
  </head>
  <body>
    <div class="page">
      <section class="sheet">
        <header class="hero">
          <div>
            <h1 class="title">${escapeHtml(config.title)}</h1>
            ${config.subtitle ? `<p class="subtitle">${escapeHtml(config.subtitle)}</p>` : ""}
          </div>
          <div class="meta">
            <div class="pill"><span>Generated</span><strong>${escapeHtml(generatedAt)}</strong></div>
            <div class="pill"><span>Total ${escapeHtml(countLabel)}</span><strong>${config.rows.length}</strong></div>
          </div>
        </header>
        <div class="table-wrap">
          ${
            config.rows.length > 0
              ? `<table>
                  <thead><tr>${headerCells}</tr></thead>
                  <tbody>${bodyRows}</tbody>
                </table>`
              : `<div class="empty">No rows available for export.</div>`
          }
        </div>
      </section>
    </div>
    <script>
      window.addEventListener("load", () => {
        setTimeout(() => {
          window.focus();
          window.print();
        }, 150);
      });
      window.addEventListener("afterprint", () => {
        window.close();
      });
    </script>
  </body>
</html>`;

  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  iframe.style.opacity = "0";
  document.body.appendChild(iframe);

  const printWindow = iframe.contentWindow;
  const printDocument = iframe.contentDocument ?? printWindow?.document;

  if (!printWindow || !printDocument) {
    iframe.remove();
    throw new Error("Unable to prepare PDF export");
  }

  const cleanup = () => {
    window.setTimeout(() => {
      iframe.remove();
    }, 300);
  };

  printWindow.onafterprint = cleanup;
  printDocument.open();
  printDocument.write(html);
  printDocument.close();
  window.setTimeout(() => {
    printWindow.focus();
    printWindow.print();
  }, 200);
}
