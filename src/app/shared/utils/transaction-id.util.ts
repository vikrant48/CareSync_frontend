/**
 * Utility class for generating unique transaction IDs
 */
export class TransactionIdUtil {
  
  /**
   * Generate a unique transaction ID
   * Format: CS-YYYYMMDD-HHMMSS-XXXX
   * Where CS = CareSync, YYYYMMDD = date, HHMMSS = time, XXXX = random 4-digit number
   */
  static generateTransactionId(): string {
    const now = new Date();
    
    // Format date as YYYYMMDD
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const dateStr = `${year}${month}${day}`;
    
    // Format time as HHMMSS
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const timeStr = `${hours}${minutes}${seconds}`;
    
    // Generate random 4-digit number
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    
    return `CS-${dateStr}-${timeStr}-${randomNum}`;
  }
  
  /**
   * Generate a shorter transaction ID for display
   * Format: CS-XXXX-YYYY
   */
  static generateShortTransactionId(): string {
    const randomPart1 = Math.floor(1000 + Math.random() * 9000);
    const randomPart2 = Math.floor(1000 + Math.random() * 9000);
    
    return `CS-${randomPart1}-${randomPart2}`;
  }
  
  /**
   * Validate transaction ID format
   */
  static isValidTransactionId(transactionId: string): boolean {
    const pattern = /^CS-\d{8}-\d{6}-\d{4}$/;
    return pattern.test(transactionId);
  }
}