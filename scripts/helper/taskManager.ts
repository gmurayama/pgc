import { Queue } from './queue';

interface ITaskManagerOptions<T> {
  create: (...args: any[]) => Task<T>
  maxResourceAvailable: number
  log?: (message: string) => void
}

type Task<T> = () => Promise<T>

interface ScheduledTask<T> {
  task: Task<T>
  callback: (...args: any[]) => any
}

export default class TaskManager<T> {
  private readonly queue: Queue<ScheduledTask<T>> = new Queue()
  private readonly create: (...args: any[]) => Task<T>
  private readonly maxAvailableResources: number
  private readonly log: (message: string) => void

  private tasksInExecution = 0;

  constructor (options: ITaskManagerOptions<T>) {
    this.create = options.create
    this.log = options.log ?? function mockLog () {}
    this.maxAvailableResources = options.maxResourceAvailable
  }

  private executor(scheduledTask: ScheduledTask<T>): void {
    if (this.tasksInExecution < this.maxAvailableResources) {
      const { task, callback } = scheduledTask;
      this.tasksInExecution++;
      task()
        .then((result) => {
          this.tasksInExecution--;
          process.nextTick(() => this.executeNextTaskFromQueue());
          callback(result);
        });
      this.log(`resource added to the pool`)
    } else {
      this.log(`enqueue resource at ${this.queue.size}º`)
      this.queue.enqueue(scheduledTask)
    }
  }

  private executeNextTaskFromQueue() {
    const task = this.queue.dequeue();
    if (task) {
      this.executor(task);
    }
  }

  run(...params: Parameters<typeof this.create>): Promise<T> {
    const task = this.create(...params);
    return new Promise<T>((resolve) => {
      this.executor({ task, callback: resolve })
    });
  }
}

