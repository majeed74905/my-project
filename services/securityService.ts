
class SecurityService {
  // INTERNAL SESSION FLAGS
  private flags = {
    creator_verified: false,
    architect_verified: false,
    secure_creator_link: false
  };

  private SECRET_NICKNAME = "Afzal";

  public isVerified(): boolean {
    return this.flags.creator_verified;
  }

  public getFlags() {
    return { ...this.flags };
  }

  /**
   * Validation: Case-insensitive, Trim spaces, Exact match after normalization
   */
  public verify(answer: string): { success: boolean; message: string } {
    const normalizedUser = answer.trim().toLowerCase();
    const normalizedSecret = this.SECRET_NICKNAME.toLowerCase();

    if (normalizedUser === normalizedSecret) {
      this.flags = {
        creator_verified: true,
        architect_verified: true,
        secure_creator_link: true
      };
      return { 
        success: true, 
        message: "Welcome Creator Mohammed Majeed(Afzal) How can I assist you?" 
      };
    } else {
      this.flags = {
        creator_verified: false,
        architect_verified: false,
        secure_creator_link: false
      };
      return { 
        success: false, 
        message: "No, you are not my creator. Please let me know how I can help you with your queries today." 
      };
    }
  }

  public logout(): void {
    this.flags = {
      creator_verified: false,
      architect_verified: false,
      secure_creator_link: false
    };
  }
}

export const securityService = new SecurityService();
