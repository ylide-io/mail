import ReactDOM from "react-dom";
import App from "./App";

import "./assets/scss/style.scss";
import "./assets/scss/font-awesome/font-awesome.scss";

import "antd/dist/antd.css";

import { BrowserRouter } from "react-router-dom";

ReactDOM.render(
    <BrowserRouter>
        <App />
    </BrowserRouter>,
    document.getElementById("root") as HTMLElement
);
