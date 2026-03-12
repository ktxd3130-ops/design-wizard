import { DesignState, OpenMagePayload } from './types';
import { useDesignStore } from './storage';
import { PlaceholderService } from './services/PlaceholderService';

export class OrderValidationService {
    /**
     * Evaluates the current design state to determine if it meets minimum
     * production requirements for passing the OpenMage contract.
     */
    static validate(state: DesignState): boolean {
        // If there are any high-severity production warnings (bleed, DPI), fail validation
        if (state.warnings.some(w => w.type === 'dpi' || w.type === 'bleed')) {
            return false;
        }

        // Must have at least one object
        if (state.objects.length === 0) {
            return false;
        }

        return true;
    }
}

export function serializeForOpenMage(): OpenMagePayload {
    const state = useDesignStore.getState().state;

    // Integrator: Payload Minifier - Strip transient / local-only properties
    const minifiedObjects = state.objects.map(obj => {
        const { id, proxyUrl, isFontLoading, ...minified } = obj as any;

        // If an S3 path exists (upload finished), forcibly rewrite the source
        // preventing local blob URLs from polluting the DB contract
        if (minified.type === 'image' && minified.s3Url) {
            minified.src = minified.s3Url;
        }

        return minified;
    });

    // Integrator: Placeholder Scrubbing
    // Ensure OpenMage gets hardcoded generated names instead of {{USER_NAME}} strings
    const hydratedObjects = PlaceholderService.hydrateTemplate(minifiedObjects);

    // Create the final, compressed JSON payload
    return {
        design_id: state.design_id,
        system_metadata: {
            browser: typeof window !== 'undefined' ? window.navigator.userAgent : 'Unknown',
            timestamp: new Date().toISOString(),
            design_version: state.version
        },
        design_state: {
            ...state,
            objects: hydratedObjects,
            sessionAssets: [],
            activeObjectId: null,
            activeObjectBox: null,
        },
        is_orderable: OrderValidationService.validate(state)
    };
}
