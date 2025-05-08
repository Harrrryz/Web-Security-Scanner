export interface ScanResult {
  sourceid:        string;
  other:           string;
  method:          string;
  evidence:        string;
  pluginId:        string;
  cweid:           string;
  confidence:      string;
  sourceMessageId: number;
  wascid:          string;
  description:     string;
  messageId:       string;
  inputVector:     string;
  url:             string;
  tags:            Record<string, string>;
  reference:       string;
  solution:        string;
  alert:           string;
  param:           string;
  attack:          string;
  name:            string;
  risk:            string;
  id:              string;
  alertRef:        string;
}

export interface SqlmapResult {
 type: string;
 title: string;
 payload: string;
}
