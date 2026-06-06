module.exports = {
  openDatabaseAsync: jest.fn().mockResolvedValue({
    execAsync: jest.fn().mockResolvedValue({}),
    getFirstAsync: jest.fn().mockResolvedValue({ user_version: 1 }),
    getAllAsync: jest.fn().mockResolvedValue([]),
    runAsync: jest.fn().mockResolvedValue({}),
    withTransactionAsync: jest.fn(async (cb) => await cb()),
    closeAsync: jest.fn().mockResolvedValue({}),
  }),
};
