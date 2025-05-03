import axios from "axios";
import { error } from "console";
import { logoutUser } from "./auth";

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
    withCredentials: true
})

api.interceptors.response.use((res) => res, async(error) => {
    const originalRequest = error.config;

    if(error.response.status === 401 || error.response.status === 403){
        try{
            axios.get('api/refresh-token', {withCredentials: true})
            return api(originalRequest) // retry original request
        } catch {
            await logoutUser()
            if(typeof window !== 'undefined'){
                window.location.href = '/login' // redirect to login page
            }
        } return Promise.reject(error)
    }

    return Promise.reject(error)
})

export default api;