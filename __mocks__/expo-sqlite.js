const mockDb = {
  getFirstAsync: jest.fn().mockResolvedValue({ user_version: 1, count: 0 }),
  getAllAsync: jest.fn().mockResolvedValue([]),
  runAsync: jest.fn().mockResolvedValue(undefined),
  execAsync: jest.fn().mockResolvedValue(undefined),
  withTransactionAsync: jest.fn().mockImplementation((fn) => fn()),
};

module.exports = {
  openDatabaseAsync: jest.fn().mockResolvedValue(mockDb),
};
