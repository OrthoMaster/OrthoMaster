import { useState, useEffect } from "react";
import { useGetUser } from "./useGetUser.hook";


export const useOrthoMasterRoles = () => {
    const user = useGetUser()
    const [isAdmin, setIsAdmin] = useState(false)
    const [isSeller, setIsSeller] = useState(false)
    const [isTester, setIsTester] = useState(false)
    const [isPrimaryManager, setIsPrimaryManager] = useState(false)
    const [isSecondaryManager, setIsSecondaryManager] = useState(false)
    
    useEffect(() => {
        user.data.roles?.split(',').forEach(element => {
            switch (element) {
                case 'admin':
                    setIsAdmin(true)
                    break;
                case 'seller':
                    setIsSeller(true)
                    break;
                case 'tester':
                    setIsTester(true)
                    break;
                case 'primary_manager':
                    setIsPrimaryManager(true)
                    break;
                case 'secondary_manager':
                    setIsSecondaryManager(true)
                    break;
                default:
                    break;
            }
        });
    }, []);
    
    return {isAdmin, isSeller, isPrimaryManager, isSecondaryManager, isTester};
}