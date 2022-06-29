import {useNavigate} from "react-router-dom";
import auth from "../stores/Auth";

export const useNav = () => {
    const navigate = useNavigate()

    const nav = (path: string) => {
        const dev = auth.isDev
        navigate({
            pathname: path,
            search: dev ? `?dev=${dev}`: ""
        })
    }

    return nav
}
