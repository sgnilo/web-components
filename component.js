class ComponentData {
    constructor(option, updateCallback) {
        this.assign(option);
        this.updateCallback = updateCallback;
    }

    get(stateName) {
        return stateName ? this.state[stateName] : this.state;
    }

    set(stateName, stateValue) {
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
        this.data = new ComponentData(this.initData(), this.propsChange.bind(this));
        this.shadow = this.attachShadow({mode: 'closed'});
        const componentName = this.constructor.componentName;
        const template = document.querySelector(`template[component="${componentName}"]`).content.cloneNode(true);
        this.shadow.appendChild(template);
        this.slots = {};
        this.getNodes('slot').forEach(slot => {
            this.slots[slot.name || 'default'] = {slot};
            slot.addEventListener('slotchange', () => {
                const nodes = slot.assignedElements({flatten: true});
                this.slots[slot.name || 'default']['slotNode'] = nodes;
                if (Object.keys(this.slots).every(slotName => this.slots[slotName]['slotNode'])) {
                    this.render && this.render(this.data.get());
                }
            });
        });
        !Object.keys(this.slots)[0] && this.render && this.render(this.data.get());
    }

    initData() {
        return {};
    }

    getNode(selector) {
        let exactNode = this.shadow.querySelector(selector);
        let node = exactNode;

        while (node !== this.shadow) {
            if (node.nodeName == 'SLOT') {
                const slotNodes = this.slots[node.name || 'default']['slotNode'] || [];
                const exact = (slotNodes.filter(child => child.matches(selector) || child.querySelector(selector)) || [])[0];
                if (exact) {
                    exactNode = exact;
                }
                break;
            }
            node = node.parentNode;
        }

        return exactNode;
    }

    getNodes(selector) {
        return this.shadow.querySelectorAll(selector);
    }

    slot(slotName) {
        return (this.slots[slotName] || {}).slot;
    }

    slotNode(slotName) {
        return ((this.slots[slotName] || {}).slotNode || [])[0];
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
