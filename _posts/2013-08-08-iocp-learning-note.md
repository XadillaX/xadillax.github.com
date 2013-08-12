---
layout      : post
title       : IOCP学习笔记（未完待续）
category    : Programming
tags        : [ "IOCP", "Windows", "Socket" ]
---
{% include JB/setup %}

　　网络上大部分的讲解IOCP模型文章都比较断章取义，要么是这里冒出一个术语，那边出来一个不知名的名词。

　　本文主要是给那些暂时还无太多的Windows编程基础的人阅读，里面解释了一些相应的前驱知识。比如管道、重叠I/O模型等等。

　　如果你已经对这些了如指掌了，可以直接忽略本文——因为本文是给那些初学者看的。

　　不过即使是给初学者看的，很多概念只是提个大概，让读者心里有个印象而已。更进一步的详细知识还是需要读者自行翻阅相关资料。


## 前驱知识 ##

### 管道 ###

　　**管道（PIPE）**是用于进程间通信的一段共享内存。创建管道的进程称为**管道服务器**，连接到一个管道的进程称为**管道客户机**。一个进程在向管道写入数据之后，另一个进程就可以从管道的另一端将其读出来。

　　管道分两种，匿名管道和命名管道。

#### 匿名管道 ####

　　匿名管道是在父进程和子进程间单向传输数据的一种未命名管道，只能在本地计算机中使用，而不能用于网络间通信。

　　匿名管道由 `CreatePipe()` 函数创建。该函数在创建匿名管道的同时返回两个句柄：读句柄和写句柄。其原型如下：

{% highlight cpp %}
BOOL CreatePipe(
    PHANDLE hReadPipe,
    PHANDLE hWritePipe,
    LPSECURITY_ATTRIBUTES lpPipeAttributes,
    DWORD nSize
);
{%  endhighlight%}

> 其中 `hReadPipe` 为指向读句柄的指针， `hWritePipe` 为指向写句柄的指针； `lpPipeAttributes` 为指向安全属性的指针；最后的 `nSize` 为管道大小，若为 `0` 则由系统来决定。

　　匿名管道不支持异步读写操作。

#### 命名管道 ####

　　命名管道是在管道服务器和一台或多台管道客户机之间进行单向或者双向通信的一种命名的管道。一个命名管道的所有实例都共享同一个管道名，但是每一个实例都拥有独立的缓存和句柄，并且为 `客户机 - 服务器` 通信提供一个分离的管道。

　　命名管道可以在同一台计算机的不同进程之间或者跨越一个网络的不同计算机的不同进程间进行有连接的可靠数据通信。如果连接中断，连接双方都能立即受到连接断开的信息。

　　每个命名管道都有一个唯一的名字，以区分存在于系统的命名对象列表中的其它命名管道。管道服务器在调用 `CreateNamedPipe()` 函数创建管道的一个或多个实例时为其指定了名称。对于管道客户机，则是在调用 `CreateFile()` 或 `CallNamedPipe()` 函数在连接一个命名管道实例时对管道名进行指定。

　　命名管道对其标识采用 `UNC格式`：

> `\\Server\Pipe\[Path]Name`

　　其中第一部分 `\\Server` 指定了服务器的名字，命名管道服务就在此服务器创建。其字符串部分可以为一个小数点（表示本机）、星号（当前网络字段）、域名或者是一个真正的服务；第二部分是一个不可变化的硬编码字符串；第三部分 `\[Path]Name` 则使应用程序可以唯一定义及标识一个命名管道的名字，而且可以设置多级目录。

　　管道服务器首次调用 `CreateNamedPipe()` 函数时，使用 `nMaxInstance` 参数指定了能同时存在的管道实例的最大数目。服务器可以重复调用 `CreateNamedPipe()` 函数去创建新的管道实例，直至达到设定的最大实例数。

　　下面给出 `CreateNamedPipe()` 的函数原型：

{% highlight cpp %}
HANDLE CreateNamedPipe(
    LPCTSTR lpName,
    DWORD dwOpenMode,
    DWORD dwPipeMode,
    DWORD nMaxInstance,
    DWORD nOutBufferSize,
    DWORD nInBufferSize,
    DWORD nDefaultTimeOut,
    LPSECURITY_ATTRIBUTES lpSecurityAttributes
);
{%  endhighlight%}

> 这里的 `lpName` 就是所谓的管道名称指针了， `dwOpenMode` 为管道打开的模式（用来指示管道在创建好之后，它的传输方向、I/O控制以及安全模式）， `dwPipeMode` 为管道模式， `nMaxInstance` 正如之前所说的是最大的管道实例数， `nOutBufferSize` 为输出缓存的大小， `nInBufferSize` 为输入缓存的大小， `nDefaultTimeOut` 为超时设置，最后的 `lpSecurityAttributes` 为安全属性的指针。

### CreateFile, ReadFile等API

#### CreateFile()

　　这个函数可以创建或者打开一个对象的句柄，凭借此句柄我们就可以控制这些对象：

  + 控制台对象
  + 通信资源对象
  + 目录对象（只能打开）
  + 磁盘设备对象
  + 文件对象
  + 邮槽对象
  + 管道对象

　　函数原型：

{% highlight cpp %}
HANDLE CreateFile(
    LPCTSTR lpFileName,
    DWORD dwDesiredAccess,
    DWORD dwShareMode,
    LPSECURITY_ATTRIBUTES lpSecurityAttributes,
    DWORD dwCreationDisposition,
    DWORD dwFlagsAndAttributes,
    HANDLE hTemplateFile
);
{%  endhighlight%}

> **参数解析**
>
> 1. ***lpFileName：*** 一个指向无终结符的字符串指针，用来指明要创建或者打开的对象的名字。
>
> 2. ***dwDesiredAccess：*** 指明对象的控制模式。一个应用程序可以包含读控制、写控制、读/写控制、设备查询控制。
>
> 3. ***dwShareMode：*** 指定对象的共享模式。如果 `dwShareMode == 0` 则表示是互斥使用的。如果 `CreateFile` 打开成功，则别的程序只能等到当前程序关闭对象句柄 `CloseHandle` 后才能再打开或者使用。
>
> 4. ***lpSecurityAttributes：*** 一个指向 `SECURITY_ATTRIBUTES` 结构对象的指针，决定返回的句柄是否被子进程所继承。如果 `lpSecurityAttributes` 参数为 `NULL` ，句柄就不能被子进程继承。
>
> 5. ***dwCreationDisposition：*** 指明当打开的对象存在或不存在的时候各需要怎么样去处理。
>
> 6. ***dwFlagsAndAttributes：*** 指定文件属性和标志。
>
> 7. ***hTemplateFile：*** 把具有 `GENERIC_READ` 权限的句柄指定为一个模板文件。这个模板文件提供了文件属性和扩展属性，用于创建文件。
>
> **返回值**
>
> 如果调用成功，返回值是一个打开文件的句柄。
>
> 如果调用之前文件已经存在，且 `dwCreationDisposition` 参数为 `CREATE_ALWAYS` 或者 `OPEN_AWAYS` ，用 `GetLastError` 返回 `ERROR_ALREADY_EXISTS` （即使调用成功也会返回这个值）。如果调用之前不存在 `GetLastError` 返回 `0` 。
>
> 如果调用失败，返回值是 `INVALID_HANDLE_VALUE` 。要进一步了解出错原因，调用 `GetLastError`。

#### CloseHandle()

　　用于关掉一个打开的对象句柄。

　　函数原型如下：

{% highlight cpp %}
BOOL CloseHandle(
    HANDLE hObject
);
{%  endhighlight%}

#### ReadFile()

　　`ReadFile()` 函数从文件指针指定的位置读取数据。读操作完毕之后，文件指针将根据实际读出的数据自动进行调整，除非文件句柄是以 `OVERLAPPED` 属性值打开的。如果是以 `OVERLAPPED` 打开的I/O，应用程序就需要自己手动调整文件指针。

　　这个函数被设计成兼有同步和异步操作。 `ReadFileEx()` 函数则设计成只支持异步操作，异步操作允许应用程序在读文件期间可以同时进行其它的操作。

　　函数原型：

{% highlight cpp %}
BOOL ReadFile(
    HANDLE hFile,
    LPVOID lpBuffer,
    DWORD nNumberOfBytesToRead,
    LPDWORD lpNumberOfBytesRead,
    LPOVERLAPPED lpOverlapped
);
{%  endhighlight%}

> **参数解析**
>
> 1. ***hFile：*** 文件句柄（必须具有 `GENERIC_READ` 访问权限）。
>
> 2. ***lpBuffer：*** 用来接收从文件中读出的数据的缓冲区。
>
> 3. ***nNumberOfBytesToRead：*** 指明要读取的字节总数。
>
> 4. ***lpNumberOfBytesRead：*** 一个变量指针，用来存储实际传输的字节总数。 `ReadFile` 在做所有事情（包括错误检查）之前，先将这个值赋为 `0`。当 `ReadFile` 从一个命名管道上返回 `TRUE` 时这个参数为 `0` ，说明消息管道另一端调用 `WriteFile` 时设置的 `nNumberOfBytesToWrite` 参数为 `0` 。如果 `lpOverlapped` 不是 `NULL` ， `lpNumberOfBytesRead` 可以设置为 `NULL` 。如果是一个 `Overlapped` 形式的读操作，我们可以动用 `GetOverlappedResult` 函数来获得传输的实际字节数。如果 `hFile` 关联的是一个**完成端口（I/O Completion Port）**，那么可以调用 `GetQueuedCompletionStatus` 函数来获得传输的实际字节数。如果完成端口被占用，而你用的是一个用于释放内存的回调例程，对于 `lpOverlapped` 参数指向的 `OVERLAPPED` 结构体来说，为这个参数指定 `NULL` 可以避免重新分配内存时发生内存泄露。内存泄露会导致返回这个参数值时是一个非法值。
>
> 5. ***lpOverlapped：*** 一个指向 `OVERLAPPED` 结构体的指针。如果 `hFile` 是以 `FILE_FLAG_OVERLAPPED` 方式获得的句柄，这个结构是必须的，不能为 `NULL` （否则函数会在错误的时刻报告读操作已经完成了）。这时，读操作在由 `OVERLAPPED` 中 `Offset` 成员指定的偏移地址开始读，并且在实际完成读操作之前就返回了。在这种情况下， `ReadFile` 返回 `FALSE` ， `GetLastError` 报告的错误类型是 `ERROR_IO_PENDING` 。这允许调用进程继续其它工作直到读操作完成。 `OVERLAPPED` 结构中的事件将会在读操作完成时被使用。
>
> **返回值**
>
> 有如下任一种情况发生都会导致函数返回：
>
> 1. 在管道另一端的写操作完成后。
> 2. 请求的字节数传输完毕。
> 3. 发生错误。
>
> 如果函数正确，返回非零。
>
> 如果返回值是非零但接受的字节数为 `0` ，那么可能是文件指针在读操作期间超出了文件的 `end` 位置。然而如果文件以 `FILE_FLAG_OVERLAPPED` 方式打开， `lpOverlapped` 参数不为 `NULL` ，文件指针在读操作期间超出了文件的 `end` 位置，那么返回值肯定是 `FALSE` ， `GetLastError` 返回的错误是 `ERROR_HANDLE_EOF` 。

#### WriteFile

　　可以以同步或异步方式向一个对象句柄中写数据。

　　函数原型：

{% highlight cpp %}
BOOL WriteFile(
    HANDLE hFile,
    LPCVOID lpBuffer,
    DWORD nNumberOfBytesToWrite,
    LPDWORD lpNumberOfBytesWritten,
    LPOVERLAPPED lpOverlapped
);
{%  endhighlight%}

　　其它信息与 `ReadFile` 极其相似，可以参考 `ReadFile` 。

### Winsock重叠I/O模型

#### 重叠I/O模型的概念

　　当调用 `ReadFile()` 和 `WriteFile()` 时，如果最后一个参数 `lpOverlapped` 设置为 `NULL` ，那么线程就阻塞在这里，知道读写完指定的数据后，它们才会返回。这样在读写大文件的时候，很多时间都浪费在等待 `ReadFile()` 和 `WriteFile()` 的返回上面。如果 `ReadFile()` 和 `WriteFile()` 是往管道里面读写数据，那么有可能阻塞更久，导致程序性能下降。

　　为了解决这个问题，Windows引进了**重叠I/O**的概念，它能够同时以多个线程处理多个I/O。其实你自己开多个线程也可以处理多个I/O，但是系统内部对I/O的处理在性能上有很大的优化。它是Windows下实现异步I/O的最常用的方式。

　　Windows为几乎全部类型的文件提供这个工具：磁盘文件、通信端口、命名管道和套接字。通常，使用 `ReadFile()` 和 `WriteFile()` 就可以很好地执行重叠I/O。

　　重叠模型的核心是一个重叠数据结构。若想以重叠方式使用文件，必须用 `FILE_FLAG_OVERLAPPED` 标志打开它，例如：

{% highlight cpp %}
HANDLE hFile = CreateFile(
    lpFileName,
    GENERIC_READ | GENERIC_WRITE,
    FILE_SHARE_READ | FILE_SHARE_WRITE,
    NULL,
    OPEN_EXISTING,
    FILE_FLAG_OVERLAPPED,
    NULL
);
{%  endhighlight%}

　　如果没有规定该标志，则针对这个文件（句柄），重叠I/O是不可用的。如果设置了该标志，当调用 `ReadFile()` 和 `WriteFile()` 操作这个文件（句柄）时，必须为最后一个参数提供 `OVERLAPPED` 结构：

{% highlight cpp %}
// WINBASE.H
typedef struct _OVERLAPPED {
    DWORD  Internal;
    DWORD  InternalHigh;
    DWORD  Offset;
    DWORD  OffsetHigh;
    HANDLE hEvent;
} OVERLAPPED, *LPOVERLAPPED;
{%  endhighlight%}

　　头两个32位的结构字 `Internal` 和 `InternalHigh` 由系统内部使用；其次两个32位结构字 `Offset` 和 `OffsetHigh` 使得可以设置64位的偏移量，该偏移量是要文件中读或写的地方。

　　因为I/O异步发生，就不能确定操作是否按顺序完成。因此，这里没有当前位置的概念。对于文件的操作，总是规定该偏移量。**在数据流下（如COM端口或socket），没有寻找精确偏移量的方法，所以在这些情况中，系统忽略偏移量**。这四个字段不应由应用程序直接进行处理或使用， `OVERLAPPED` 结构的最后一个参数是可选的事件句柄，当I/O完成时，该事件对象受信（signaled）。程序通过等待该对事件对象受信来做善后处理。

　　设置了 `OVERLAPPED` 参数后， `ReadFile()` / `WriteFile()` 的调用会立即返回，这时候你可以去做其他的事（所谓异步），系统会自动替你完成 `ReadFile()` / `WriteFile()` 相关的I/O操作。你也可以同时发出几个 `ReadFile()` / `WriteFile()` 的调用（所谓重叠）。当系统完成I/O操作时，会将 `OVERLAPPED.hEvent` 置信，我们可以通过调用 `WaitForSingleObject` / `WaitForMultipleObjects` 来等待这个I/O完成通知，在得到通知信号后，就可以调用 `GetOverlappedResult` 来查询I/O操作的结果，并进行相关处理。由此可以看出， `OVERLAPPED` 结构在一个重叠I/O请求的初始化及其后续的完成之间，提供了一种沟通或通信机制。注意 `OVERLAPPED` 结构的生存周期，一般动态分配，待I/O完成后，回收重叠结构。

　　以Win32重叠I/O机制为基础，自**WinSock 2**发布开始，重叠I/O便已集成到新的**WinSock API**中，比如 `WSARecv()` / `WSASend()` 。这样一来，重叠I/O模型便能适用于安装了**WinSock 2**的所有Windows平台。可以一次投递一个或多个WinSock I/O请求。针对那些提交的请求，在它们完成之后，应用程序可为它们提供服务（对I/O的数据进行处理）。

　　相应的，要像在一个套接字上使用重叠I/O模型来处理网络数据通信，首先必须使用 `WSA_FLAG_OVERLAPPED` 这个标志来创建一个套接字，如下所示：

{% highlight cpp %}
SOCKET s = WSASocket(AF_INET, SOCK_STEAM, 0, NULL, 0, WSA_FLAG_OVERLAPPED);
{%  endhighlight%}

　　创建套接字的时候，加入使用的是 `Socket()` 函数而非 `WSASocket()` 函数，那么会默认设置 `WSA_FLAG_OVERLAPPED` 标志。成功创建好了一个套接字，将其与本地接口绑定到一起以后，便可以开始进行这个套接字上的重叠I/O操作，方法是调用下述的Winsock 2函数，同时为他们制定一个 `WSAOVERLAPPED` 结构参数（`#define WSAOVERLAPPED OVERLAPPED // WINSOCK2.H`）：

  1. `WSASend()`
  2. `WSASendTo()`
  3. `WSARecv()`
  4. `WSARecvFrom()`
  5. `WSAIoctl()`
  6. `AcceptEx()`
  7. `TransmitFile()`

　　若随一个 `WSAOVERLAPPED` 结构一起调用这些函数，函数会立即返回，无论套接字是否设为锁定模式。他们依赖于 `WSAOVERLAPPED` 结构来返回一个I/O请求操作的结果。

　　比起**阻塞**、**select**、**WSAAsyncSelect**以及**WSAEventSelect**等模型，**Winsock**的重叠I/O模型使应用程序能达到更佳的系统性能。因为它和着四种模型不同的是，使用重叠模型的应用程序通知缓冲区收发系统直接使用数据。也就是说，如果应用程序投递了一个***10KB***大小的缓冲区来接收数据，且数据已经到达套接字，则该数据将直接被拷贝到投递的缓冲区。而这4种模型中，数据到达并拷贝到单套接字接收缓冲区（Per Socket Buffer）中，此时应用程序会被系统通知可以读入的字节数。当应用程序调用接收函数之后，数据才从单套接字缓冲区拷贝到应用程序的缓冲区。这样就减少了一次从I/O缓冲区到应用程序缓冲区的拷贝，差别就在于此。

　　实际编程时，可以投递一个0字节缓冲区的 `WSARecv` / `WSASend` 操作，这样就没有用户缓冲区与I/O操作相关联，避免了用户缓冲区的锁定（过多的锁定可能导致非分页内存池耗尽，即 `WSAENOBUFS` ），应用程序绕开单套接字缓冲区而直接与**TCP Stack**进行数据交互，从而避免了内存拷贝。当然，只要投递了足够多的重叠发送/接收操作，就能避免额外的内存拷贝，这时将单套接字缓冲区设置为0并不能提升性能。因为应用程序的发送缓冲区将始终被锁定直到可以下传给TCP，所以停用套接字的发送缓冲区对性能的影响比停用接收缓冲区小。然而，如果接收缓冲区被设置为0，而又未投递重叠接收操作，则进来的数据都只能停留在TCP Stack中，而TCP驱动程序的缓冲区最多只能接收窗口大小。TCP缓冲区被定位在非分页内存池中，假如很多连接发数据过来，但我们根本没有投递接收操作，则将消耗大量的非分页内存池。非分页内存池是一种有限的资源，过多的锁定可能导致非分页内存池耗尽，即 `WSAENOBUFS` 。

　　在Windows NT和Windows 2000中，模重叠I/O型也允许应用程序以一种重叠方式实现对套接字连接的处理。具体的做法是在监听套接字上调用 `AcceptEx` 函数。 `AcceptEx` 是一个特殊的WinSock扩展函数，由**mswsock.dll**实现，使用时需包含**Mswsock.h**头文件，链接**Mswsock.lib**库文件。该函数最初的设计宗旨是在Windows NT与Windows 2000操作系统上使用Win 32的重叠I/O机制。但事实上，它也适用于WinSock 2中的重叠I/O。 `AcceptEx` 的定义如下：

{% highlight cpp %}
// MSWSOCK.H
AcceptEx(
    IN SOCKET sListenSocket,
    IN SOCKET sAcceptSocket,
    IN PVOID lpOutputBuffer,
    IN DWORD dwReceiveDataLength,
    IN DWORD dwLocalAddressLength,
    IN DWORD dwRemoteAddressLength,
    OUT LPDWORD lpdwBytesReceived,
    IN LPOVERLAPPED lpOverlapped
);
{%  endhighlight%}

> **参数解析**
>
> 1. ***sListenSocket：*** 指定的是一个监听套接字。
>
> 2. ***sAcceptSocket：*** 指定的是另一个套接字，负责对进入连接请求的“接受”。 `AcceptEx()` 函数和 `accept()` 函数的区别在于，我们必须提供接受的套接字，而不是让函数自动为我们创建。正是由于要提供套接字，所以要求我们事先调用 `socket()` 或者 `WSASocket()` 函数创建一个套接字，以便通过 `sAcceptSocket` 参数，将其传递给 `AcceptEx()` 。
>
> 3. ***lpOutputBuffer：*** 指定的是一个特殊的缓冲区，因为它要负责三种数据的接收：服务器的本地地址，客户机的远程地址，以及在新建连接上接收的第一个数据块。存储顺序是：
> > 接收到的数据块→本地地址→远程地址
>
> 4. ***dwReceiveDataLength：*** 以字节为单位，指定了在 `lpOutputBuffer` 缓冲区开头保留多大的空间，用于数据的接收。如果这个参数设为 `0` ，那么只接受连接，不伴随接受数据。
>
> 5. ***dwLocalAddressLength/dwRemoteAddressLength：*** 以字节为单位，指定在 `lpOutputBuffer` 缓冲区中，保留多大空间，在一个套接字被接受的时候，用于本地和远程地址信息的保存。要注意的是，和当前采用的传送协议允许的最大地址长度比较起来，这里指定的缓冲区大小至少应多出 `16字节` 。举个例子来说，假设正在使用的是***TCP/IP***协议，那么这里的大小应该设为 `sizeof(SOCKADDR_IN) + 16` 。
>
> 6. ***lpdwBytesReceived：*** 用于返回接收到的实际数据量。以字节为单位。只有在操作以同步方式完成的前提下，才会设置i这个参数加入 `AcceptEx()` 函数返回 `ERROR_IO_PENDING` ，那么这个参数永远都不会设置，我们必须利用完成事件通知机制，获知实际读取的字节量。
>
> 7. ***lpOverlapped：*** 它对应的是一个 `OVERLAPPED` 结构，允许 `AcceptEx()` 以一种异步方式工作。如我们早先所述，只有在一个重叠I/O应用中，该函数才需要使用事件对象通知机制（`hEvent` 字段），这是由于此时没有一个完成例程参数可供使用。

#### 获取重叠I/O操作完成结果

　　当异步I/O请求挂起之后，最终要知道I/O操作是否完成。一个重叠I/O请求最终完成后，应用程序要负责读取重叠I/O操作的结果。对于读，直到I/O完成，接收缓冲器才有效；对于写，要知道是否成功，有几种方法可以做到这点，最直接的方法是调用 `(WSA)GetOverlappedResult` ，其函数原型如下：

{% highlight cpp %}
WINBASEAPI BOOL WINAPI GetOverlappedResult(
    HANDLE hFile,
    LPOVERLAPPED lpOverlapped,
    LPDWORD lpNumberOfBytesTransferred,
    BOOL bWait
);

BOOL WSAGetOverlappedResult(
    SOCKET s,
    LPWSAOVERLAPPED lpOverlapped,
    LPDWORD lpcbTransfer,
    BOOL fWait,
    LPDWORD lpdwFlags
);
{%  endhighlight%}

> **参数解析**
>
> 1. ***参数一：*** 文件/套接字句柄。
>
> 2. ***参数二：*** 参数一关联的 `(WSA)OVERLAPPED` 结构，在调用 `CreateFile()` 、 `WSASocket()` 或者 `AcceptEx()` 时指定。
>
> 3. ***参数三：*** 指向字节计数指针，负责接收一次重叠发送或者接收操作实际传输的字节数。
>
> 4. ***参数四：*** 确定命令是否等待的标志。 `bWait` 参数用于决定函数是否应该等待一次重叠操作完成。若将 `bWait` 设置为 `TRUE` ，那么知道操作完成函数才返回；若设为 `FALSE` ，而且操作仍然处于未完成状态，那么 `(WSA)GetOverlappedResult()` 函数会返回 `FALSE` 值。如 `(WSA)GetOverlappedResult()` 函数调用成功，返回值就是 `TRUE` 。这意味着我们的重叠I/O操作已经成功完成，而且由参数三 `lpNumberOfBytesTransferred` 指向的值已进行了更新。若返回值是 `FALSE` ，那么可能是由下述任何一种原因造成的：
>
>   * 重叠I/O操作仍处在“待决”状态。
>   * 重叠操作已经完成，但含有错误。
>   * 重叠操作的完成状态不可判决，因为在提供给 `WSAGetOverlappedResult` 函数的一个或多个参数中，存在着错误。
>
> 失败后，由 `lpNumberOfBytesTransferred` 参数指向的值不会进行更新，而且我们的应用程序调用 `(WSA)GetLastError()` 函数，检查到底是何种原因造成了调用失败以使用相应答错处理。如果错误码为 `SOCKET_ERROR/WSA_IO_INCOMPLETE (Overlapped I/O event is not in a signaled state)` 或者 `SOCKET_ERROR/WSA_IO_PENDING (Overlapped I/O operation is in progress)` ，则表明I/O仍在进行。当然这不是真正错误，任何其它错误码则真正表明一个实际错误。