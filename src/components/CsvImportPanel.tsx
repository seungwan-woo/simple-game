import { useState } from 'react';
import * as E from 'fp-ts/Either';
import { parseCsvText } from '../core/csvTextParser';
import { RawCsvRow } from '../core/types';
import { downloadSampleCsv } from '../data/sampleCsv';
import { ImportStatusBadge } from './ImportStatusBadge';

interface CsvImportPanelProps {
  isLoading: boolean;
  loadedCount: number;
  totalCount: number;
  onImportRows: (rows: RawCsvRow[]) => Promise<void>;
}

export const CsvImportPanel = ({
  isLoading,
  loadedCount,
  totalCount,
  onImportRows,
}: CsvImportPanelProps) => {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFileChange = async (file: File | undefined) => {
    if (file === undefined) {
      return;
    }

    setErrorMessage(null);
    setFileName(file.name);

    try {
      const text = await file.text();
      const parsed = parseCsvText(text);

      if (E.isLeft(parsed)) {
        setErrorMessage(parsed.left.message);
        return;
      }

      await onImportRows(parsed.right);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : String(error));
    }
  };

  return (
    <section className="panel csv-import-panel">
      <div className="csv-import-header">
        <div>
          <p className="eyebrow">CSV Import</p>
          <h2>Import workshop teams</h2>
          <p>Upload a CSV file with team names and seven Korean command columns.</p>
        </div>
        <ImportStatusBadge isLoading={isLoading} loaded={loadedCount} total={totalCount} />
      </div>

      <div className="csv-import-actions">
        <label className="file-picker">
          Select CSV
          <input
            type="file"
            accept=".csv,text/csv"
            disabled={isLoading}
            onChange={(event) => handleFileChange(event.target.files?.[0])}
          />
        </label>
        <button type="button" onClick={downloadSampleCsv}>Download Sample CSV</button>
      </div>

      {fileName !== null && <p className="csv-file-name">Selected: {fileName}</p>}
      {errorMessage !== null && <p className="csv-error">{errorMessage}</p>}
    </section>
  );
};
