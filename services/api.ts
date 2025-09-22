import axios from "axios";
const apiBase = axios.create({
  baseURL: "https://google-trends-node-api.onrender.com"
})

export default apiBase