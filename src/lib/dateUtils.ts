export function formatReleaseDate(dateString?: string): string {
  if (!dateString) return 'TBA';
  
  try {
    const date = new Date(dateString);
    
    if (isNaN(date.getTime())) return 'TBA';
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (error) {
    return 'TBA';
  }
}
