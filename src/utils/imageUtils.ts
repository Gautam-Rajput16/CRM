/**
 * Utility functions for image processing and browser information
 */

/**
 * Compress a base64 image to a target size
 * @param base64Image - Base64 encoded image string
 * @param maxSizeKB - Maximum size in kilobytes
 * @returns Compressed base64 image
 */
export const compressImage = async (
    base64Image: string,
    maxSizeKB: number = 200
): Promise<string> => {
    return new Promise((resolve, reject) => {
        try {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                if (!ctx) {
                    reject(new Error('Failed to get canvas context'));
                    return;
                }

                // Calculate new dimensions maintaining aspect ratio
                let width = img.width;
                let height = img.height;
                const maxDimension = 1024;

                if (width > height && width > maxDimension) {
                    height = (height / width) * maxDimension;
                    width = maxDimension;
                } else if (height > maxDimension) {
                    width = (width / height) * maxDimension;
                    height = maxDimension;
                }

                canvas.width = width;
                canvas.height = height;

                // Draw and compress
                ctx.drawImage(img, 0, 0, width, height);

                // Start with quality 0.8 and reduce if needed
                let quality = 0.8;
                let compressedImage = canvas.toDataURL('image/jpeg', quality);

                // Reduce quality until size is acceptable
                while (compressedImage.length > maxSizeKB * 1024 && quality > 0.1) {
                    quality -= 0.1;
                    compressedImage = canvas.toDataURL('image/jpeg', quality);
                }

                resolve(compressedImage);
            };

            img.onerror = () => {
                reject(new Error('Failed to load image'));
            };

            img.src = base64Image;
        } catch (error) {
            reject(error);
        }
    });
};

/**
 * Validate image format
 * @param base64Image - Base64 encoded image string
 * @returns True if valid
 */
export const validateImageFormat = (base64Image: string): boolean => {
    if (!base64Image || typeof base64Image !== 'string') {
        return false;
    }

    // Check if it's a valid base64 data URL
    const validFormats = ['data:image/jpeg', 'data:image/jpg', 'data:image/png', 'data:image/webp'];
    return validFormats.some(format => base64Image.startsWith(format));
};

/**
 * Get browser and device information
 * @returns Browser info string
 */
export const getBrowserInfo = (): string => {
    try {
        const userAgent = navigator.userAgent;
        const platform = navigator.platform;

        // Extract browser name
        let browserName = 'Unknown';
        if (userAgent.indexOf('Firefox') > -1) {
            browserName = 'Firefox';
        } else if (userAgent.indexOf('Chrome') > -1) {
            browserName = 'Chrome';
        } else if (userAgent.indexOf('Safari') > -1) {
            browserName = 'Safari';
        } else if (userAgent.indexOf('Edge') > -1) {
            browserName = 'Edge';
        } else if (userAgent.indexOf('Opera') > -1 || userAgent.indexOf('OPR') > -1) {
            browserName = 'Opera';
        }

        // Detect mobile
        const isMobile = /Mobile|Android|iPhone|iPad|iPod/.test(userAgent);

        return `${browserName} on ${platform}${isMobile ? ' (Mobile)' : ''}`;
    } catch (error) {
        console.error('Error getting browser info:', error);
        return 'Unknown Browser';
    }
};

/**
 * Format image for storage
 * @param imageData - Raw image data
 * @returns Formatted and compressed image
 */
export const formatImageForStorage = async (imageData: string): Promise<string> => {
    if (!validateImageFormat(imageData)) {
        throw new Error('Invalid image format');
    }

    // Compress the image
    const compressed = await compressImage(imageData, 200);
    return compressed;
};

/**
 * Get current timestamp in ISO format
 * @returns ISO timestamp string
 */
export const getCurrentTimestamp = (): string => {
    return new Date().toISOString();
};

/**
 * Format timestamp for display
 * @param timestamp - ISO timestamp string
 * @returns Formatted time string (HH:MM AM/PM)
 */
export const formatTimeForDisplay = (timestamp: string): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
};

/**
 * Format date for display
 * @param timestamp - ISO timestamp string
 * @returns Formatted date string (MMM DD, YYYY)
 */
export const formatDateForDisplay = (timestamp: string): string => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
};

/**
 * Calculate work duration between login and logout
 * @param loginTime - Login timestamp
 * @param logoutTime - Logout timestamp
 * @returns Duration string (e.g., "8h 30m")
 */
export const calculateWorkDuration = (loginTime: string, logoutTime: string): string => {
    const login = new Date(loginTime);
    const logout = new Date(logoutTime);
    const diffMs = logout.getTime() - login.getTime();

    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    return `${hours}h ${minutes}m`;
};
