import axios from "axios";

export const fetchAuditLogs = () => {
  return axios.get("/api/admin/audit-logs");
};
