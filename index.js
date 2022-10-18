class ComponentData {
    constructor(option, updateCallback) {
        this.assign(option);
        this.updateCallback = updateCallback;
    }

    get(stateName) {
        return stateName ? this.state[stateName] : this.state;
    }

    set(stateName, stateValue) {
        try {
            stateValue = JSON.parse(stateValue);
        } catch (e) {};
        this.state[stateName] = stateValue;
        this.updateCallback && this.updateCallback(this.state);
    }

    assign(newState) {
        this.state = {...(this.state || {}), ...newState};
    }
}

class Component extends HTMLElement {
    static componentName = 'custom-component'
    static propNames = []
    constructor() {
        super();
        this.data = new ComponentData(this.initData(), this.superRender.bind(this));
        this.shadow = this.attachShadow({mode: 'closed'});
        const componentName = this.constructor.componentName;
        this.template = document.querySelector(`template[component="${componentName}"]`).content.cloneNode(true);
        this.superRender(this.data.get());
    }

    initData() {
        return {};
    }

    flush() {
        this.shadow.innerHTML = '';
        this.shadow.appendChild(this.template.cloneNode(true));
    }

    superRender(data) {
        this.flush();
        this.render && this.render(data);
    }

    getNode(selector) {
        return this.shadow.querySelector(selector);
    }

    getNodes(selector) {
        return this.shadow.querySelectorAll(selector);
    }

    for(node, list, callBack) {
        if (!list.length) {
            return;
        }
        const parent = node.parentNode;
        list.forEach((item, index) => {
            let newNode;
            if (index < list.length - 1) {
                newNode = node.cloneNode();
            }
            parent.appendChild(callBack(node, item, index) || node);
            node = newNode;
        });
    }

    clone(node) {
        return node.cloneNode(true);
    }

    fire(eventName, eventData) {
        this.dispatchEvent(new CustomEvent(eventName, {detail: eventData}));
    }

    attributeChangedCallback(propName, oldVal, newVal) {
        this.data.set(propName, newVal);
    }

    nextTick(callback) {
        queueMicrotask(callback);
    }

    static get observedAttributes() {
        return this.propNames;
    }
};
