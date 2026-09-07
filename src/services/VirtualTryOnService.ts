import {
  BodyViewType,
  ClothingItem,
  UserBodyProfile,
  TryOnGenerationResult,
  TryOnGenerationProgress,
} from '../types';
import {
  IVirtualTryOnProvider,
  FlashdrobeAIServiceProvider,
  ClientNeuralCompositorProvider,
  TryOnRequest,
} from './VirtualTryOnProvider';
import { StorageService } from './StorageService';

export class VirtualTryOnService {
  private static primaryProvider: IVirtualTryOnProvider = new FlashdrobeAIServiceProvider();
  private static fallbackProvider: IVirtualTryOnProvider = new ClientNeuralCompositorProvider();

  /**
   * Generates or retrieves cached virtual try-on result
   * with progressive loading status updates.
   */
  public static async generateVirtualTryOn(
    request: TryOnRequest,
    onProgress?: (progress: TryOnGenerationProgress) => void
  ): Promise<TryOnGenerationResult> {
    const { userBodyProfile, selectedItems, viewAngle, outfitTitle, targetClassification } = request;

    // Check if user body photo is present
    const hasPhoto =
      userBodyProfile.views[viewAngle]?.imageUrl ||
      userBodyProfile.views.front?.imageUrl;

    if (!hasPhoto) {
      throw new Error(
        'Please capture or upload your body photograph before generating a virtual try-on.'
      );
    }

    if (!selectedItems || selectedItems.length === 0) {
      throw new Error(
        'Please select at least one clothing item from your wardrobe to try on.'
      );
    }

    // Generate unique cache key from item IDs and view angle
    const itemKey = selectedItems
      .map((i) => i.id)
      .sort()
      .join('-');
    const cacheKey = `${itemKey}_${viewAngle}${targetClassification ? `_${targetClassification}` : ''}`;

    // Check cache
    const cached = StorageService.getCachedTryOn(userBodyProfile.userId, cacheKey);
    if (cached) {
      onProgress?.({
        stage: 'Loading cached try-on...',
        percent: 100,
        subtext: 'Retrieved your saved fitting simulation.',
      });
      return cached;
    }

    // Progressive stage 1
    onProgress?.({
      stage: 'Preparing your outfit...',
      percent: 20,
      subtext: 'Analyzing garment cuts, fabrics, and collar structure...',
    });
    await new Promise((r) => setTimeout(r, 450));

    // Progressive stage 2
    onProgress?.({
      stage: 'Aligning body contours...',
      percent: 45,
      subtext: 'Matching silhouette proportions and vertical drape lines...',
    });
    await new Promise((r) => setTimeout(r, 450));

    // Progressive stage 3
    onProgress?.({
      stage: 'Generating your virtual try-on...',
      percent: 75,
      subtext: 'Synthesizing multi-view fabric drape and studio lighting...',
    });

    let result: TryOnGenerationResult;
    try {
      // Attempt primary AI provider first
      result = await this.primaryProvider.generateTryOn(request);
    } catch (primaryErr: any) {
      console.warn('Primary AI try-on notice, using resilient neural fallback:', primaryErr?.message);
      // Fallback to client neural compositor provider
      try {
        result = await this.fallbackProvider.generateTryOn(request);
      } catch (fallbackErr: any) {
        throw new Error(
          'Unable to generate the virtual try-on right now. Please try again.'
        );
      }
    }

    // Progressive stage 4
    onProgress?.({
      stage: 'Almost ready...',
      percent: 95,
      subtext: 'Finalizing styling feedback and tailor adjustments...',
    });
    await new Promise((r) => setTimeout(r, 300));

    // Cache successful result
    StorageService.cacheTryOn(userBodyProfile.userId, cacheKey, result);

    onProgress?.({
      stage: 'Complete',
      percent: 100,
      subtext: 'Virtual try-on ready.',
    });

    return result;
  }
}
