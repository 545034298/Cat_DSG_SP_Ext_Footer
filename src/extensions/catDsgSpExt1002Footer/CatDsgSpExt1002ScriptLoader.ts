import { SPComponentLoader } from "@microsoft/sp-loader";
import JQueryStatic = require('jquery');
declare var window: any;
declare var jQuery: JQueryStatic;
declare var $: JQueryStatic;
namespace CatDsgSpExt1002ScriptLoader {

    export interface IScript {
        Url: string;
        GlobalExportsName: string;
        WindowPropertiesChain: string;
    }
    export function LoadScript(script: IScript, dependencies: IScript[]): Promise<object> {
        let scriptObject = GetScriptWindowObject(script);
        if (scriptObject != undefined) {
            if (script.WindowPropertiesChain.toLowerCase() == "jquery") {
                jQuery = window.jQuery as JQueryStatic as JQueryStatic;
            }
            return LoadDependencies(dependencies);
        }
        else {
            if (script.GlobalExportsName != null && script.GlobalExportsName != '') {
                return SPComponentLoader.loadScript(script.Url, { globalExportsName: script.GlobalExportsName }).then(() => {
                    return LoadDependencies(dependencies);
                });
            }
            else {
                return SPComponentLoader.loadScript(script.Url).then(() => {
                    return LoadDependencies(dependencies);
                });
            }
        }
    }
    function LoadDependencies(dependencies: IScript[]): Promise<object> {
        var scripts: Promise<object>[] = [];
        dependencies.forEach(script => {
            let scriptObject = GetScriptWindowObject(script);
            if (scriptObject == undefined) {
                if (script.GlobalExportsName != null && script.GlobalExportsName != '') {
                    scripts.push(SPComponentLoader.loadScript(script.Url, { globalExportsName: script.GlobalExportsName }));
                }
                else {
                    scripts.push(SPComponentLoader.loadScript(script.Url));
                }
            }
        });
        return Promise.all(scripts);
    }
    function GetScriptWindowObject(script: IScript): any {
        let object = undefined;
        if (script.WindowPropertiesChain != null && script.WindowPropertiesChain != '') {
            var propertiesChains = script.WindowPropertiesChain.split('.');
            for (var i = 0; i < propertiesChains.length; i++) {
                object = GetProperty(object!=undefined?object:(window as any), propertiesChains[i]);
                if (object == undefined) {
                    break;
                }
            }
        }
        return object;
    }
    function GetProperty(obj: any, propertyName: string): any {
        let objectPropertyValue = undefined;
        if (obj != undefined) {
            for (var property in obj) {
                if (property.toLocaleLowerCase() == propertyName.toLocaleLowerCase()) {
                    objectPropertyValue = obj[property];
                    break;
                }
            }
        }
        return objectPropertyValue;
    }
}
export default CatDsgSpExt1002ScriptLoader;