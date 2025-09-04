import { Platform } from 'react-native';

export interface ExportRequest {
  itinerary_data: any;
  email_pdf: boolean;
}

class ExportService {
  private static instance: ExportService;

  private constructor() {}

  static getInstance(): ExportService {
    if (!ExportService.instance) {
      ExportService.instance = new ExportService();
    }
    return ExportService.instance;
  }

  async exportItinerary(itineraryData: any): Promise<{ message?: string; success: boolean }> {
    try {
      const isMobile = Platform.OS !== 'web';
      
      const exportRequest: ExportRequest = {
        itinerary_data: itineraryData,
        email_pdf: isMobile // Email on mobile, download on web
      };

      const response = await fetch('${API_BASE_URL}/itinerary/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(exportRequest),
        credentials: 'include', // Include auth cookies
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Export failed');
      }

      if (isMobile) {
        // Mobile: API returns success message
        const result = await response.json();
        return { message: result.message, success: true };
      } else {
        // Web: API returns PDF blob for download
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        
        // Extract filename from response headers or create default
        const contentDisposition = response.headers.get('Content-Disposition');
        let filename = 'travel_itinerary.pdf';
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename=(.+)/);
          if (filenameMatch) {
            filename = filenameMatch[1].replace(/"/g, '');
          }
        }
        
        // Trigger download
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        return { message: 'PDF downloaded successfully', success: true };
      }
    } catch (error) {
      console.error('Export error:', error);
      throw error;
    }
  }
}

export default ExportService.getInstance();
