import axios from "axios";

export async function getCurrentUser() {

    try{
        const res = await axios.get('/api/auth/me', {withCredentials: true})
        return res.data // make sure it Returns
    } catch(error: unknown){
        const errorMessage =
          error instanceof Error ? error.message : "Default error message";
        console.error("Descriptive context:", errorMessage);
        return null // always return something
    }
    
}

export async function logoutUser() {
    await fetch("api/auth/logout", {method: "POST"})
}