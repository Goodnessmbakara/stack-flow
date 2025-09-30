import axios, { AxiosInstance } from "axios";
import { ENVIRONMENT } from "./environment";

export const axiosInstance: AxiosInstance = axios.create({
  baseURL: ENVIRONMENT.BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});
