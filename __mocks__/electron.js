export const remote = {
  dialog: {
    showOpenDialog: jest.fn().mockReturnValue('/some/output/path'),
    showErrorBox: jest.fn().mockReturnValue('An error box')
  }
};