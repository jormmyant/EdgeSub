import type { DataInput } from "@scripts/components/data-input";
import type { EndpointExtendConfigPrototype, EndpointPrototype } from "@config/AvalibleOptoutFormat";
import { getDefaultBackend } from "@scripts/utils/getDefaultBackend";

class SubURLGenerator extends HTMLElement {
    TargetExtendConfig: ( "RuleProvider" | "isUDP" )[];
    Endpoints: EndpointPrototype[] = JSON.parse(this.dataset.endpoints);
    defaultBackend = getDefaultBackend();

    constructor () {
        super()
        
        this.setupEventListeners();

        customElements.whenDefined("data-input").then(() => {
            this.BasicConfigElement.Backend.setDetail(`${this.BasicConfigElement.Backend.getDetail()} (${this.defaultBackend})`);
            console.info("[k-sub-url-generator] data-input registration detected, default backend modified")
        })
    }


    private setupEventListeners () {
        this.ActionElements.Generate.addEventListener("click", () => {this.CheckAndGenerate()});
        this.ActionElements.Copy.addEventListener("click", () => {this.CopyURL()});
        this.BasicConfigElement.Endpoint.addEventListener("change", (event: CustomEvent) => {this.ChangeEndpoint(event)});
    }

    private ActionElements = {
        Generate: this.querySelector("button#generate") as HTMLButtonElement,
        Copy: this.querySelector("button#copy") as HTMLButtonElement,
        MsgBlock: this.querySelector("code") as HTMLElement,
    }










    BasicConfigElement = {
        SubURL: this.querySelector("data-input#SubURL") as DataInput,
        Backend: this.querySelector("data-input#Backend") as DataInput,
        Endpoint: this.querySelector("data-input#Endpoint") as DataInput,
        isShowHost: this.querySelector("data-input#isShowHost") as DataInput,
        HTTPHeaders: this.querySelector("data-input#HTTPHeaders") as DataInput,
    }
    ExtendConfigElement = {
        RuleProviderUserspec: this.querySelector("data-input#RuleProviderUserspec") as DataInput,
        RuleProvider: this.querySelector("data-input#RuleProvider") as DataInput,
        ProxyRuleProviders: this.querySelector("data-input#ProxyRuleProviders") as DataInput,
        isUDP: this.querySelector("data-input#isUDP") as DataInput,
        isSSUoT: this.querySelector("data-input#isSSUoT") as DataInput,
        ForcedWS0RTT: this.querySelector("data-input#ForcedWS0RTT") as DataInput,
    }

    GetEndpoint (EndpointPath: string = String(this.BasicConfigElement.Endpoint.get())) {
        for (let i of this.Endpoints) {
            if (i.value === EndpointPath) {
                return i as EndpointPrototype;
            }
        }
        throw `no targeted endpoint found, expected value ${EndpointPath}`
    }

    ChangeEndpoint (event: CustomEvent) {
        const SelectedEndpointPath: string = event.detail.selectedValue;
        let Endpoint: EndpointPrototype = this.GetEndpoint(SelectedEndpointPath);
        let NeededExtendConfig = Endpoint.ExtendConfig || [];

        for (let i in this.ExtendConfigElement) {
            if (NeededExtendConfig.includes(i as EndpointExtendConfigPrototype)) {
                this.ExtendConfigElement[i].style.removeProperty("display")
            } else {
                this.ExtendConfigElement[i].style.setProperty("display", "none")
            }
        }
    }

    CheckAndGenerate () {
        const BasicConfig = {
            SubURL: this.BasicConfigElement.SubURL.get(),
            Backend: this.BasicConfigElement.Backend.get() || this.defaultBackend,
            Endpoint: this.BasicConfigElement.Endpoint.get(),
            isShowHost: this.BasicConfigElement.isShowHost.get(),
            HTTPHeaders: JSON.stringify(JSON.parse(String(this.BasicConfigElement.HTTPHeaders.get()) || "{}")),
        }
        const ExtendConfig = {
            RuleProvider: this.ExtendConfigElement.RuleProviderUserspec.get() || this.ExtendConfigElement.RuleProvider.get(),
            ProxyRuleProviders: this.ExtendConfigElement.ProxyRuleProviders.get(),
            isUDP: this.ExtendConfigElement.isUDP.get(),
            isSSUoT: this.ExtendConfigElement.isSSUoT.get(),
            ForcedWS0RTT: this.ExtendConfigElement.ForcedWS0RTT.get(),
        }
        const NeededExtendConfig = this.GetEndpoint().ExtendConfig || [];
        let Config = { ...BasicConfig }
        for (let i of NeededExtendConfig) {
            if (i in ExtendConfig) {
                Config[i] = ExtendConfig[i];
            } else {
                console.warn(`[Merge Config] ${i} required but not found in ExtendConfig.`)
            }
        }
        

        let ErrorState = false;
        for (let i in Config) {
            if (
                ( typeof Config[i] === "string" && Config[i].length === 0 )
            ) {
                alert(`${i} can't be empty`);
                ErrorState = true;
                continue;
            }
        }
        if (ErrorState === true) {
            return;
        }

        this.ActionElements.MsgBlock.innerText = this.GenerateSubURL(Config);

    }

    GenerateSubURL (Config: { SubURL: any; Backend: any; Endpoint: any; RuleProvider?: any; ProxyRuleProviders?: any; isUDP?: any; isSSUoT?: any; ForcedWS0RTT?: any; isShowHost: any, HTTPHeaders: any }) {
        let URLObj = new URL(Config.Backend);
        URLObj.pathname = Config.Endpoint;
        URLObj.search = "";
        URLObj.hash = "";

        URLObj.searchParams.append("url", Config.SubURL)
        Config.RuleProvider && URLObj.searchParams.append("remote_config", Config.RuleProvider)
        Config.ProxyRuleProviders && URLObj.searchParams.append("proxy_rule_providers", Config.ProxyRuleProviders && Config.Backend)
        Config.isUDP && URLObj.searchParams.append("udp", Config.isUDP.toString())
        Config.isSSUoT && URLObj.searchParams.append("ss_uot", Config.isSSUoT.toString())
        Config.isShowHost && URLObj.searchParams.append("show_host", Config.isShowHost.toString())
        Config.ForcedWS0RTT && URLObj.searchParams.append("forced_ws0rtt", Config.ForcedWS0RTT.toString())
        Config.HTTPHeaders !== "{}" && URLObj.searchParams.append("http_headers", Config.HTTPHeaders)
        return URLObj.toString();
    }

    CopyURL () {
        if (!navigator.clipboard) {
            alert("navigator.clipboard API not found on your drowser")
            return;
        }
        let URLtoCopy = this.ActionElements.MsgBlock.innerText;
        navigator.clipboard.writeText(URLtoCopy).then( () => {
            alert("已将连接复制到剪贴板");
        }).catch(function(err) {
            alert(`err: ${err}`);
        });
    }
}

customElements.define("k-suburl-generator", SubURLGenerator)
console.info("[k-suburl-generator] registered")
