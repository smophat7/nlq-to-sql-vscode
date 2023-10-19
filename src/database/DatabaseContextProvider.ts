export interface DatabaseContextProvider {
  openConnection(): Promise<void>;
  closeConnection(): void;
  getSchema(): Promise<string>;
  getSampleData(): Promise<string>;
}
