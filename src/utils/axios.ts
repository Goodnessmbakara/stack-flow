import axios, { AxiosInstance } from "axios";
import { environment } from "./environment";

export const axiosInstance: AxiosInstance = axios.create({
  baseURL: environment.BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});
