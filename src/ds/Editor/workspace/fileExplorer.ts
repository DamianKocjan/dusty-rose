import { getBaseName } from '../../utils/files';

interface IContextMenuAction {
  name: string;
  handler: (e: MouseEvent) => void;
}

function getContextMenuOptions({
  isFile,
  isDirectory,
  path,
}: {
  isFile: boolean;
  isDirectory: boolean;
  path: string;
}): IContextMenuAction[] {
  if (!isFile && isDirectory) {
    return [
      {
        name: 'Create folder',
        handler: () => {
          const folderName = 'testNameCreate';

          if (folderName !== null) {
            window.ds.mkdir(`${path}/${folderName}`);
          }
        },
      },
      {
        name: 'Create file',
        handler: () => {
          const fileName = 'testNameCreate.txt';

          if (fileName !== null) {
            window.ds.write(`${path}/${fileName}`, '');
          }
        },
      },
      {
        name: 'Rename',
        handler: (e: MouseEvent) => {
          const newName = 'testName';

          const lastSlash = path.lastIndexOf('/');
          const basePath = path.slice(0, lastSlash)[0];

          if (newName !== null) {
            window.ds.rename(path, `${basePath}/${newName}`);

            (e.target as HTMLElement).dataset.path = `${basePath}/${newName}`;
          }
        },
      },
      {
        name: 'Delete',
        handler: () => {
          window.ds.delete(path);
        },
      },
    ];
  }
  return [
    {
      name: 'Rename',
      handler: (e: MouseEvent) => {
        const newName = 'testName.txt';

        const lastSlash = path.lastIndexOf('/');
        const basePath = path.slice(0, lastSlash)[0];

        if (newName !== null) {
          window.ds.rename(path, `${basePath}/${newName}`);

          (e.target as HTMLElement).dataset.path = `${basePath}/${newName}`;
        }
      },
    },
    {
      name: 'Delete',
      handler: () => {
        window.ds.delete(path);
      },
    },
  ];
}

class Item {
  path: string;
  isDirectory: boolean;
  isFile: boolean;
  childrens: {
    [path: string]: Item;
  };

  constructor(
    path: string,
    isFile = true,
    isDirectory = false,
    readonly isRoot = false
  ) {
    this.path = path;
    this.isDirectory = isDirectory;
    this.isFile = isFile;

    this.childrens = {};

    this.isRoot && this._explore(this.path);
  }

  private _explore(path: string): void {
    if (!this.isFile && this.isDirectory) {
      const result = window.ds.explore(path);

      result.map(({ name, isDirectory, isFile }) => {
        this.childrens[name] = new Item(`${path}/${name}`, isFile, isDirectory);
      });
    }
  }
}

export class FileExplorer {
  tree: Item;

  constructor(path: string) {
    this.tree = new Item(path, false, true, true);

    this._init();
  }

  _init(): void {
    this._renderFileExplorer();

    const togglers = document.getElementsByClassName('caret');

    for (let i = 0; i < togglers.length; i++) {
      togglers[i].addEventListener('click', function () {
        this.parentElement.querySelector('.nested').classList.toggle('active');
        this.classList.toggle('caret-down');

        this.dataset.isExpanded === 'true'
          ? (this.dataset.isExpanded = 'false')
          : (this.dataset.isExpanded = 'true');
      });
    }

    this._initContextMenu();
  }

  private _renderFileExplorer(): void {
    const dir = document.querySelector('.dir');

    dir.innerHTML = '';
    dir.appendChild(this._createElement(this.tree));
  }

  private _renderContextMenu(
    actions: IContextMenuAction[],
    context: HTMLElement
  ): void {
    context.innerHTML = '';

    actions.forEach((action) => {
      const menuItem = document.createElement('div');
      menuItem.innerHTML = action.name;
      menuItem.addEventListener('click', action.handler);

      context.appendChild(menuItem);
    });
  }

  private _initContextMenu(): void {
    const context = document.getElementById('context');
    const explorerItems = document.querySelectorAll('.dir li');

    explorerItems.forEach((item) => {
      item.addEventListener('contextmenu', (e: MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();

        const path = (item as HTMLElement).dataset.path;
        const isFile = (item as HTMLElement).dataset.isFile === 'true';
        const isDirectory =
          (item as HTMLElement).dataset.isDirectory === 'true';

        this._renderContextMenu(
          getContextMenuOptions({ isFile, isDirectory, path }),
          context
        );

        // position menu at the right-click cursor
        context.style.left = e.clientX + 'px';
        context.style.top = e.clientY + 'px';
        context.classList.add('show');
      });
    });

    document.addEventListener('click', (e) => {
      e.preventDefault();

      context.classList.remove('show');
    });
  }

  private _expandFolder(e: MouseEvent, item: Item): void {
    if (
      Object.keys(item.childrens).length > 0 ||
      (e.target as HTMLElement).dataset.isExpanded === 'true'
    )
      return;

    const result = window.ds.explore(item.path);

    result.map(({ name, isDirectory, isFile }) => {
      item.childrens[name] = new Item(
        `${item.path}/${name}`,
        isFile,
        isDirectory
      );
    });

    this._init();
  }

  private _createElement(item: Item): HTMLElement {
    const el = document.createElement('li');

    el.dataset.path = item.path;
    el.dataset.isFile = item.isFile === true ? 'true' : 'false';
    el.dataset.isDirectory = item.isDirectory === true ? 'true' : 'false';

    const name = getBaseName(item.path);

    if (item.isDirectory) {
      const span = document.createElement('span');
      span.classList.add('caret');
      item.isRoot && span.classList.add('caret-down');
      span.textContent = name;

      span.dataset.path = item.path;
      span.dataset.isFile = 'false';
      span.dataset.isDirectory = 'true';
      span.dataset.isExpanded = 'false';

      el.addEventListener('click', (e: MouseEvent) => {
        this._expandFolder(e, item);
      });

      el.appendChild(span);

      const ul = document.createElement('ul');
      ul.classList.add('nested');
      item.isRoot && ul.classList.add('active');

      for (const name in item.childrens) {
        ul.appendChild(this._createElement(item.childrens[name]));
      }

      el.appendChild(ul);
    } else {
      el.textContent = name;
    }

    return el;
  }
}