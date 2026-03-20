import { MarineDashboardService } from "../../core/application/marineDashboardService";
import { HttpClient } from "./httpClient";
import { MarineApiClient } from "./marineApiClient";

const baseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";

const httpClient = new HttpClient(baseUrl);
const apiClient = new MarineApiClient(httpClient);

export const marineDashboardService = new MarineDashboardService(apiClient);
