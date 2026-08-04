import { jsPDF } from 'jspdf';

let _logoBase64: string | null = null;

/**
 * Fetches /logo.png and converts it to a base64 data URL once,
 * caching the result so subsequent calls are instant.
 */
export async function getLogoBase64(): Promise<string | null> {
  if (_logoBase64) return _logoBase64;
  try {
    const res = await fetch('/logo.png');
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

/**
 * Draws the standard branded PDF header with the platform logo.
 * Returns the Y position right below the header so content can begin there.
 *
 * @param doc      - The jsPDF instance.
 * @param subtitle - The report label shown on the right side of the header.
 * @param logo     - Base64 PNG data URL. If null, falls back to text-only header.
 */
export function drawPdfHeader(
  doc: jsPDF,
  subtitle: string,
  logo: string | null
): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  const headerH = 30;

  // Blue banner
  doc.setFillColor(0, 114, 198);
  doc.rect(0, 0, pageWidth, headerH, 'F');

  // Green accent line
  doc.setFillColor(30, 181, 58);
  doc.rect(0, headerH, pageWidth, 2, 'F');

  // Logo image (26×26 mm, top-left with a small margin)
  if (logo) {
    doc.addImage(logo, 'PNG', margin, 2, 26, 26);
  }

  // Platform name – positioned to the right of the logo
  const textX = logo ? margin + 30 : margin;
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('Salone Fuel Monitor', textX, 18);

  // Subtitle label – right-aligned
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(255, 255, 255);
  doc.text(subtitle.toUpperCase(), pageWidth - margin, 18, { align: 'right' });

  // Return Y position where the body should start
  return headerH + 2 + 10; // below the green accent + small gap
}
