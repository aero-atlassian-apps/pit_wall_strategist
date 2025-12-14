import api, { route } from '@forge/api';

export interface CustomFieldIds {
    storyPoints: string | null;
    sprint: string | null;
    epicLink?: string | null;
    flagged?: string | null;
}

let fieldCache: CustomFieldIds | null = null;

export class FieldDiscoveryService {
    async discoverCustomFields(): Promise<CustomFieldIds> {
        if (fieldCache) return fieldCache;

        try {
            const response = await api.asApp().requestJira(route`/rest/api/3/field`, { headers: { Accept: 'application/json' } });
            const fields: any[] = await response.json();

            fieldCache = {
                storyPoints: this.findFieldByName(fields, ['Story Points', 'Story point estimate', 'Estimation']) || 'customfield_10016',
                sprint: this.findFieldByName(fields, ['Sprint']) || 'customfield_10020',
                epicLink: this.findFieldByName(fields, ['Epic Link', 'Parent Link']),
                flagged: this.findFieldByName(fields, ['Flagged', 'Flag'])
            };
            return fieldCache;
        } catch (error) {
            return {
                storyPoints: 'customfield_10016',
                sprint: 'customfield_10020'
            };
        }
    }

    private findFieldByName(fields: any[], patterns: string[]): string | null {
        for (const pattern of patterns) {
            const field = fields.find(f => f.name?.toLowerCase() === pattern.toLowerCase() || f.name?.toLowerCase().includes(pattern.toLowerCase()));
            if (field) return field.id as string;
        }
        return null;
    }

    getCacheSnapshot() {
        return fieldCache;
    }
}

export const fieldDiscoveryService = new FieldDiscoveryService();
