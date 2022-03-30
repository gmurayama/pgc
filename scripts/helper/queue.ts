interface Node<T> {
  data: T
  next: Node<T> | undefined
}

export class Queue<T> {
  head: Node<T> | undefined;
  last: Node<T> | undefined;
  size: number = 0;

  public enqueue(data: NonNullable<T>): void {
    const node: Node<T> = {
      data,
      next: undefined
    }

    // list is empty
    if (this.head === undefined) {
      this.head = node;
      this.last = node;
      return;
    }

    // list has one item
    if (this.head.next === undefined) {
      this.head.next = node;
      this.last = node;
      return;
    }

    // list has two or more items
    this.last!.next = node;
    this.last = node;

    this.size++;
  }

  public dequeue(): T | undefined {
    // list is empty
    if (this.head === undefined) {
      return undefined;
    }

    // list has one or more items
    const { data, next } = this.head;
    this.head = next;

    // list is now empty after dequeue
    if (this.head === undefined) {
      this.last = undefined;
    }

    this.size--;

    return data;
  }
}