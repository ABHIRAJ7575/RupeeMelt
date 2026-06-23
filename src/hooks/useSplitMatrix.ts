import { useCallback } from 'react';

export interface SplitMember {
  userId: string;
  isIncluded: boolean;
  // If we wanted to allow uneven manual overrides later, we'd add it here
}

/**
 * Hook for multi-tenant relational exclusion schema math.
 * Handles recalculating fractional balances instantly in Paisa without float errors.
 */
export function useSplitMatrix() {
  /**
   * Calculates how much each included person owes for a given transaction amount.
   * 
   * @param totalAmountPaisa The total expense amount in Paisa (integer)
   * @param members The array of users and whether they are included in this split
   * @returns An array of objects mapping userId to their owed amount in Paisa
   */
  const calculateSplits = useCallback((totalAmountPaisa: number, members: SplitMember[]) => {
    const includedMembers = members.filter(m => m.isIncluded);
    
    if (includedMembers.length === 0) {
      return [];
    }

    // Base division integer math
    const splitAmountPaisa = Math.floor(totalAmountPaisa / includedMembers.length);
    
    // Calculate any remainder due to integer division (e.g. 100 / 3 = 33 remainder 1)
    let remainder = totalAmountPaisa % includedMembers.length;

    // Distribute remainder one paisa at a time to the first few included members
    // to ensure the sum exactly matches the total amount.
    return members.map(member => {
      if (!member.isIncluded) {
        return { userId: member.userId, amountOwedPaisa: 0 };
      }

      let finalAmount = splitAmountPaisa;
      if (remainder > 0) {
        finalAmount += 1;
        remainder -= 1;
      }

      return {
        userId: member.userId,
        amountOwedPaisa: finalAmount
      };
    });
  }, []);

  return { calculateSplits };
}
