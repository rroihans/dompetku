export type Combinator = 'AND' | 'OR';

export type Operator = 
    | 'equals' | 'notEquals' 
    | 'contains' | 'notContains' 
    | 'gt' | 'gte' | 'lt' | 'lte' 
    | 'in' | 'notIn'
    | 'between'; // Special for date

export interface Rule {
    field: string;
    operator: Operator;
    value: any;
}

export interface RuleGroup {
    combinator: Combinator;
    rules: (Rule | RuleGroup)[];
}

export function buildPrismaQuery(group: RuleGroup): any {
    if (!group.rules || group.rules.length === 0) return {};

    const conditions = group.rules.map(rule => {
        if ('combinator' in rule) {
            return buildPrismaQuery(rule as RuleGroup);
        } else {
            return buildRule(rule as Rule);
        }
    });

    return {
        [group.combinator]: conditions
    };
}

function buildRule(rule: Rule): any {
    const { field, operator, value } = rule;

    // Handle nested fields like "debitAkun.nama"
    if (field.includes('.')) {
        const parts = field.split('.');
        let current = {};
        const root = current;
        for (let i = 0; i < parts.length - 1; i++) {
            // @ts-ignore
            current[parts[i]] = {};
            // @ts-ignore
            current = current[parts[i]];
        }
        // @ts-ignore
        current[parts[parts.length - 1]] = mapOperator(operator, value);
        return root;
    }

    return {
        [field]: mapOperator(operator, value)
    };
}

function mapOperator(operator: Operator, value: any): any {
    switch (operator) {
        case 'equals': return { equals: value };
        case 'notEquals': return { not: value };
        case 'contains': return { contains: value };
        case 'notContains': return { not: { contains: value } };
        case 'gt': return { gt: value };
        case 'gte': return { gte: value };
        case 'lt': return { lt: value };
        case 'lte': return { lte: value };
        case 'in': return { in: Array.isArray(value) ? value : [value] };
        case 'notIn': return { notIn: Array.isArray(value) ? value : [value] };
        case 'between': 
            // Value assumed to be [start, end]
            return { gte: value[0], lte: value[1] };
        default: return { equals: value };
    }
}
