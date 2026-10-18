type ItemData = {
  itemName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
};

export type ConversationState = {
  step:
    | "select_customer"
    | "search_product"
    | "enter_quantity"
    | "enter_item_name"
    | "enter_unit_price"
    | "confirm_more";
  docType: "estimate" | "invoice";
  customerId?: string;
  customerName?: string;
  items: ItemData[];
  currentItem: Partial<ItemData>;
};

const states = new Map<string, ConversationState>();

export function getState(userId: string): ConversationState | undefined {
  return states.get(userId);
}

export function setState(userId: string, state: ConversationState): void {
  states.set(userId, state);
}

export function clearState(userId: string): void {
  states.delete(userId);
}
