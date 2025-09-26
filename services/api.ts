import axios from "axios";
const apiBase = axios.create({
  baseURL: "https://trends.imirante.com.br/"
})

export default apiBase