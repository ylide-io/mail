import { makeAutoObservable } from "mobx";

class Modals {
    passwordModalVisible: boolean = false;
    passwordModalReason: string = "";
    passwordModalHandler: (password: string | null) => void = () => {};

    get anyModalVisible() {
        return this.passwordModalVisible;
    }

    constructor() {
        makeAutoObservable(this);
    }
}

const modals = new Modals();
export default modals;
