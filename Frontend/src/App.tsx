import { useState } from 'react';
// import './App.css';
import axios from 'axios';
import { ScanResult, SqlmapResult } from './api.interface';

// ChevronDown Icon component (or use a library like heroicons)
const ChevronDownIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
  </svg>
);


function App() {
  const [target, setTarget] = useState('https://todo.putianai.me/');
  const [scanResults, setScanResults] = useState<ScanResult[]>([]);
  const [sqlmapResults, setSqlmapResults] = useState<SqlmapResult[]>([]);
  const [loadingScan, setLoadingScan] = useState(false);
  const [loadingSqlmap, setLoadingSqlmap] = useState(false);
  const [errorScan, setErrorScan] = useState<string | null>(null);
  const [errorSqlmap, setErrorSqlmap] = useState<string | null>(null);

  // State for accordion open/closed status
  const [openScanResultIds, setOpenScanResultIds] = useState<Record<string, boolean>>({});
  const [openSqlmapResultIndexes, setOpenSqlmapResultIndexes] = useState<Record<number, boolean>>({});

  const toggleScanResult = (id: string) => {
    setOpenScanResultIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleSqlmapResult = (index: number) => {
    setOpenSqlmapResultIndexes(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const fetchData = async (url: string) => {
    if (!url) {
      setErrorScan("Target URL cannot be empty.");
      return;
    }
    setLoadingScan(true);
    setErrorScan(null);
    setScanResults([]);
    setOpenScanResultIds({}); // Reset accordion state
    try {
      const response = await axios.post(`http://127.0.0.1:8000/scan?target=${encodeURIComponent(url)}`);
      const data = response.data as ScanResult[];
      setScanResults(data);
    } catch (error) {
      console.error('Error fetching scan data:', error);
      setErrorScan("Failed to fetch scan data. Check the console for details.");
    } finally {
      setLoadingScan(false);
    }
  };

  const fetchSqlmapData = async (url: string) => {
    if (!url) {
      setErrorSqlmap("Target URL cannot be empty.");
      return;
    }
    setLoadingSqlmap(true);
    setErrorSqlmap(null);
    setSqlmapResults([]);
    setOpenSqlmapResultIndexes({}); // Reset accordion state
    try {
      const response = await axios.post(`http://127.0.0.1:8000/sqlmap?target=${encodeURIComponent(url)}`);
      const data = response.data as SqlmapResult[];
      setSqlmapResults(data);
    } catch (error) {
      console.error('Error fetching SQLMap data:', error);
      setErrorSqlmap("Failed to fetch SQLMap data. Check the console for details.");
    } finally {
      setLoadingSqlmap(false);
    }
  };

  const commonInputSection = (
    title: string,
    onFetch: (url: string) => void,
    isLoading: boolean,
    buttonText: string
  ) => (
    <div className="bg-white p-6 rounded-lg shadow-lg w-full">
      <h2 className="text-xl font-semibold text-gray-700 mb-4">{title}</h2>
      <div className="space-y-4">
        <input
          type="text"
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          placeholder="e.g., https://example.com"
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
        />
        <button
          onClick={() => onFetch(target)}
          disabled={isLoading}
          className={`w-full px-4 py-2 font-medium text-white rounded-md transition-colors
            ${isLoading
              ? 'bg-indigo-300 cursor-not-allowed'
              : 'bg-indigo-600 hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50'
            }`}
        >
          {isLoading ? 'Fetching...' : buttonText}
        </button>
      </div>
    </div>
  );

  const getRiskColor = (risk?: string): string => {
    // ... (getRiskColor implementation remains the same)
    switch (risk?.toLowerCase()) {
      case 'high': return 'text-red-600 font-semibold';
      case 'medium': return 'text-yellow-600 font-semibold';
      case 'low': return 'text-green-600 font-semibold';
      case 'informational': return 'text-blue-600 font-semibold';
      default: return 'text-gray-700';
    }
  };

  const getConfidenceColor = (confidence?: string): string => {
    // ... (getConfidenceColor implementation remains the same)
    switch (confidence?.toLowerCase()) {
      case 'high': case 'firm': return 'text-green-700 font-semibold';
      case 'medium': return 'text-yellow-700 font-semibold';
      case 'low': return 'text-orange-600 font-semibold';
      case 'tentative': return 'text-purple-600 font-semibold';
      default: return 'text-gray-700';
    }
  };

  const renderScanResultField = (
    // ... (renderScanResultField implementation remains the same)
    label: string,
    value: string | number | undefined | null,
    options?: { valueClass?: string; breakMode?: 'break-all' | 'break-words'; isUrl?: boolean }
  ) => {
    if (value === undefined || value === null || (typeof value === 'string' && value.trim() === '')) {
      return null;
    }
    const valStr = value.toString();
    const breakClass = options?.breakMode || 'break-words';
    const valueBaseClass = options?.valueClass || 'text-gray-700';

    return (
      <div>
        <p className="text-gray-800">
          <strong className="font-medium text-gray-600">{label}:</strong>{' '}
          {options?.isUrl ? (
            <a href={valStr} target="_blank" rel="noopener noreferrer" className={`hover:underline ${valueBaseClass} ${breakClass}`}>
              {valStr}
            </a>
          ) : (
            <span className={`${valueBaseClass} ${breakClass}`}>
              {valStr}
            </span>
          )}
        </p>
      </div>
    );
  };


  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 flex flex-col items-center space-y-10">
      <header className="text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">Web Security Scanner</h1>
        <p className="text-lg text-gray-600">Enter a URL to scan for vulnerabilities.</p>
      </header>

      {/* Scan Section */}
      <section className="w-full max-w-3xl space-y-6">
        {commonInputSection(
          "Perform General Scan",
          fetchData,
          loadingScan,
          "Fetch Scan Data"
        )}

        {errorScan && <p className="text-red-500 bg-red-100 p-3 rounded-md text-sm">{errorScan}</p>}

        {scanResults.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-2xl font-semibold text-gray-700 mb-6">Scan Results ({scanResults.length})</h3>
            <ul className="space-y-3"> {/* Reduced space-y for tighter accordion look */}
              {scanResults.map((result) => {
                const isOpen = !!openScanResultIds[result.id];
                return (
                  <li key={result.id} className="bg-gray-50 rounded-md border border-gray-200 shadow-sm overflow-hidden">
                    <button
                      onClick={() => toggleScanResult(result.id)}
                      className="w-full flex justify-between items-center text-left px-4 py-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-opacity-75"
                      aria-expanded={isOpen}
                      aria-controls={`scan-result-content-${result.id}`}
                    >
                      <span className="flex-1">
                        <h4 className="text-lg font-medium text-indigo-700">
                          {result.name || result.alert || 'Unnamed Scan Result'}
                        </h4>
                        <span className={`text-sm ${getRiskColor(result.risk)}`}>Risk: {result.risk || 'N/A'}</span>
                      </span>
                      <ChevronDownIcon className={`w-5 h-5 text-gray-600 transform transition-transform duration-200 ${isOpen ? 'rotate-180' : 'rotate-0'}`} />
                    </button>

                    <div
                      id={`scan-result-content-${result.id}`}
                      className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[2000px]' : 'max-h-0'}`} // Adjust max-h as needed
                    >
                      <div className={`p-4 border-t border-gray-200 ${isOpen ? 'opacity-100' : 'opacity-0'} transition-opacity duration-200 delay-100`}>
                        <p className="text-xs text-gray-500 mb-3">ID: {result.id}</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-3 text-sm">
                          {renderScanResultField("Confidence", result.confidence, { valueClass: getConfidenceColor(result.confidence) })}
                          {renderScanResultField("Plugin ID", result.pluginId)}
                          {renderScanResultField("Alert Ref", result.alertRef)}
                          {renderScanResultField("CWE ID", result.cweid)}
                          {renderScanResultField("WASC ID", result.wascid)}
                          {renderScanResultField("Method", result.method)}
                          {renderScanResultField("Parameter", result.param)}
                          {renderScanResultField("Input Vector", result.inputVector)}
                          {renderScanResultField("Source ID", result.sourceid)}
                          {renderScanResultField("Src Msg ID", result.sourceMessageId)}
                          {renderScanResultField("Message ID", result.messageId)}

                          <div className="sm:col-span-2 lg:col-span-3">
                            {renderScanResultField("URL", result.url, { breakMode: 'break-all', valueClass: 'text-blue-600', isUrl: true })}
                          </div>
                          <div className="sm:col-span-2 lg:col-span-3">
                            {renderScanResultField("Description", result.description, { breakMode: 'break-words' })}
                          </div>
                          <div className="sm:col-span-2 lg:col-span-3">
                            {renderScanResultField("Attack", result.attack, { breakMode: 'break-all', valueClass: 'font-mono bg-gray-100 p-1 rounded text-red-700' })}
                          </div>
                          <div className="sm:col-span-2 lg:col-span-3">
                            {renderScanResultField("Evidence", result.evidence, { breakMode: 'break-all', valueClass: 'font-mono bg-gray-100 p-1 rounded' })}
                          </div>
                          <div className="sm:col-span-2 lg:col-span-3">
                            {renderScanResultField("Solution", result.solution, { breakMode: 'break-words' })}
                          </div>
                          <div className="sm:col-span-2 lg:col-span-3">
                            {renderScanResultField("Reference", result.reference, { breakMode: 'break-words', isUrl: true, valueClass: 'text-blue-600' })}
                          </div>
                          <div className="sm:col-span-2 lg:col-span-3">
                            {renderScanResultField("Other", result.other, { breakMode: 'break-words' })}
                          </div>

                          {result.tags && Object.keys(result.tags).length > 0 && (
                            <div className="sm:col-span-2 lg:col-span-3 mt-2">
                              <strong className="block font-medium text-gray-600 mb-1">Tags:</strong>
                              <div className="flex flex-wrap gap-2">
                                {Object.entries(result.tags).map(([key, value]) => (
                                  <span key={key} className="px-2.5 py-1 bg-sky-100 text-sky-700 text-xs rounded-full font-medium">
                                    <strong className="font-semibold">{key}:</strong> {value}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>
        )}
        {loadingScan && !scanResults.length && (
          <div className="text-center text-gray-500">Loading scan results...</div>
        )}
      </section>

      {/* SQLMap Section */}
      <section className="w-full max-w-xl space-y-6">
        {commonInputSection(
          "Perform SQL Injection Scan (SQLMap)",
          fetchSqlmapData,
          loadingSqlmap,
          "Fetch SQLMap Data"
        )}

        {errorSqlmap && <p className="text-red-500 bg-red-100 p-3 rounded-md text-sm">{errorSqlmap}</p>}

        {sqlmapResults.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-2xl font-semibold text-gray-700 mb-6">SQLMap Results ({sqlmapResults.length})</h3>
            <ul className="space-y-3">
              {sqlmapResults.map((result, index) => {
                const isOpen = !!openSqlmapResultIndexes[index];
                return (
                  <li key={index} className="bg-gray-50 rounded-md border border-gray-200 shadow-sm overflow-hidden">
                    <button
                      onClick={() => toggleSqlmapResult(index)}
                      className="w-full flex justify-between items-center text-left px-4 py-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-opacity-75"
                      aria-expanded={isOpen}
                      aria-controls={`sqlmap-result-content-${index}`}
                    >
                      <span className="flex-1 text-lg font-medium text-indigo-700">
                        Finding {index + 1}: <span className="text-gray-700 font-normal text-base">{result.title}</span>
                      </span>
                      <ChevronDownIcon className={`w-5 h-5 text-gray-600 transform transition-transform duration-200 ${isOpen ? 'rotate-180' : 'rotate-0'}`} />
                    </button>
                    <div
                      id={`sqlmap-result-content-${index}`}
                      className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[1000px]' : 'max-h-0'}`} // Adjust max-h
                    >
                      <div className={`p-4 border-t border-gray-200 space-y-2 text-sm ${isOpen ? 'opacity-100' : 'opacity-0'} transition-opacity duration-200 delay-100`}>
                        <p><strong className="font-medium text-gray-600">Type:</strong> <span className="text-gray-700">{result.type}</span></p>
                        <p><strong className="font-medium text-gray-600">Title:</strong> <span className="text-gray-700">{result.title}</span></p>
                        <p>
                          <strong className="font-medium text-gray-600">Payload:</strong>{' '}
                          <code className="block text-xs bg-gray-200 text-red-700 p-2 rounded break-all mt-1">
                            {result.payload}
                          </code>
                        </p>
                      </div>
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>
        )}
        {loadingSqlmap && !sqlmapResults.length && (
          <div className="text-center text-gray-500">Loading SQLMap results...</div>
        )}
      </section>

      <footer className="text-center text-gray-500 text-sm mt-auto pt-8">
        <p>© {new Date().getFullYear()} Security Scanner. Use responsibly.</p>
      </footer>
    </div>
  );
}

export default App;