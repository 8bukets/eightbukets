const { performance } = require('perf_hooks');
const app = require('./app.js');

// Mock performance.now
jest.mock('perf_hooks', () => ({
    performance: {
        now: jest.fn()
    }
}));

// Mock updateOutput from app.js to avoid actual execution
jest.mock('./app.js', () => {
    const originalModule = jest.requireActual('./app.js');
    return {
        ...originalModule,
        updateOutput: jest.fn(),
        setPromptOutput: jest.fn(),
        setCurrentPrompt: jest.fn(),
        parseVariables: jest.fn(() => []),
    };
});

describe('benchmark_varMap.js', () => {
    let originalConsoleLog;
    let consoleLogMock;

    beforeEach(() => {
        jest.clearAllMocks();

        originalConsoleLog = console.log;
        consoleLogMock = jest.fn();
        console.log = consoleLogMock;
    });

    afterEach(() => {
        console.log = originalConsoleLog;
    });

    it('should run benchmark and log correct times', () => {
        // Setup performance.now mock to simulate exactly 100ms passing
        performance.now.mockReturnValueOnce(1000).mockReturnValueOnce(1100);

        const { runBenchmark, ITERATIONS } = require('./benchmark_varMap.js');

        const executionTime = runBenchmark();

        // Check logs
        expect(consoleLogMock).toHaveBeenCalledWith(`Running baseline benchmark with ${ITERATIONS} iterations...`);
        expect(consoleLogMock).toHaveBeenCalledWith(`Baseline Execution Time: 100.00 ms`);

        // Check return value
        expect(executionTime).toBe(100);

        // Check if updateOutput was called the correct number of times
        // 1000 warmup + ITERATIONS
        expect(app.updateOutput).toHaveBeenCalledTimes(1000 + ITERATIONS);
    });
});
