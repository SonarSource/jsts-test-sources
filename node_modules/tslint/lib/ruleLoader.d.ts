import { IOptions, IRule, RuleConstructor } from "./language/rule/rule";
export interface IEnableDisablePosition {
    isEnabled: boolean;
    position: number;
}
export declare function loadRules(ruleOptionsList: IOptions[], enableDisableRuleMap: Map<string, IEnableDisablePosition[]>, rulesDirectories?: string | string[], isJs?: boolean): IRule[];
export declare function findRule(name: string, rulesDirectories?: string | string[]): RuleConstructor | "not-found";
