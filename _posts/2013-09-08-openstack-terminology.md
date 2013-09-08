---
layout      : post
title       : OpenStack术语 [译]
category    : Programming
tags        : [ "OpenStack" ]
---
{% include JB/setup %}

　　为了更快融入 **OpenStack** 的环境中，基本的术语还是整理一下比较好。

　　不过啊，这货翻译得我死去活来，欲仙欲死。原文链接：[http://docs.openstack.org/grizzly/openstack-compute/install/apt/content/terminology.html](http://docs.openstack.org/grizzly/openstack-compute/install/apt/content/terminology.html)。


<!-- 我是小小分割符 -->

## 版本代号以及发布说明

每个 **OpenStack** 发布版本都有它的代号，以首字母递增的方式取名（如 **Havana** 就在 **Grizzly** 之后）。它们也有着相应的版本号，如下表所示。

  发布名称        发布日期       对象存储版本      其它模块版本
------------   -------------  ----------------  ---------------
Havana            2013-10     2013.3            未知
Grizzly           2013-04     2013.1            1.7.6
Folsom            2012-10     2012.2            1.7.2
Essex             2012-04     2012.1            1.4.8
Diablo            2011-10     2011.3            1.4.3
Cactus            2011-04     2011.2            1.3.0
Bexar             2011-03     2011.1            1.2.0
Austin            2010-10     0.9.0             1.0.0

从 **Cactus** 开始，**OpenStack** 采用了每六个月一发布的时间表。2013年10月的发布版本叫 **Havana**。

若想查看各版本发布说明请点击：

  * Havana
  * [Grizzly](http://wiki.openstack.org/ReleaseNotes/Grizzly)
  * [Folsom](http://wiki.openstack.org/ReleaseNotes/Folsom)
  * [Essex](http://wiki.openstack.org/ReleaseNotes/Essex)
  * [Diablo](http://wiki.openstack.org/ReleaseNotes/Diablo)
  * [Cactus](http://wiki.openstack.org/ReleaseNotes/Cactus)
  * [Bexar](http://wiki.openstack.org/ReleaseNotes/Bexar)
  * [Austin](http://wiki.openstack.org/ReleaseNotes/Austin)

## 代码代号

每个 **OpenStack** 服务都有它自己的代码代号。如映像服务的代码代号就是 **Glance**。下表就是代码代号的完整列表：

服务名                    代码代号
---------------           --------------------
Identity                  Keystone
Compute                   Nova
Image                     Glance
Dashboard                 Horizon
Object Storage            Swift
Volumes                   Cinder
Networking                Quantum

这些代码代号在配置文件名、命令行实用程序中有所体现。例如 **Identity** 服务中的配置文件就是 `keystone.conf`。

此外，项目可以经过孵化阶段然后集成进经过总能综合测试之后发布的 **OpenStack** 服务集。有两个项目将通过这一过程被集成进 **Havana** 版本。

服务名                    代码代号
---------------           --------------------
Metering                  Ceilometer
Orchestration             Heat

## OpenStack 服务与 Linux 服务

在Linux的世界里，服务（或者说守护进程）将在后台运行一个单一的程序，并且通常监听着一个端口来响应服务请求。OpenStack服务换句话说，其实就是协同运行一系列Linux服务。

OpenStack服务由多个Linux服务实现。例如，**nova-compute** 和 **nova-scheduler** 是两个Linux服务，它们实现了 **Compute** 服务。**OpenStack** 也依赖于一些第三方服务，如数据库（通常是 **MySQL**）、消息代理（通常是 **RabbitMQ** 或者 **Qpid**）。

## 存储：对象，块和文件

很多云计算用力需要持久的远程存储。存储解决方案经常被划分为三类：对象存储、块存储和文件存储。

注意一些存储解决方案支持多类型。比如 **[NexentaStor](http://nexenta.com/)** 就支持块存储和文件存储（并且公告说以后将会支持对象存储），**[GlusterFS](http://www.gluster.org/)** 支持文件存储和对象存储，还有 **[Ceph Storage](http://www.ceph.com/)** 支持对象存储、块存储以及文件存储。

### 对象存储

在 **OpenStack** 对象存储服务叫 **Swift**。

相关概念：Amazon S3，Rackspace Cloud Files，Ceph Storage。

在对象储存中，文件被 **HTTP** 接口暴露在外，通常是以 **REST API** 形式。所有客户数据访问是在用户层完成：操作系统并不知道远程存储系统的存在。在 **OpenStack** 中，对象存储提供这一种功能。用户通过HTTP请求来访问和修改文件。因为对象存储服务提供的数据访问接口是在抽象的底层，人们经常构建上层对象存储来构建基于文件的提供高层次抽象的应用程序（求勘正）。例如 **Image** 服务可以被配置为对象存储服务的一个后端。另一个使用对象存储的解决方案就是作为一个内容分发网络（CDN），用于承载静态web内容（如图片和媒体文件），因为对象储存本身就提供了一个HTTP接口。

### 块存储 (SAN)

在 **OpenStack** 块存储服务叫 **Cinder**。

相关概念：Amazon Elastic Block Store (EBS)，Ceph RADOS Block Device (RBD)，iSCSI。

通过块存储，文件被低级别的电脑总线如SCSI或者ATA暴露在外，并且可通过网络访问。块存储与SAN（存储区域网络）同义。客户端通过操作系统在设备级别访问数据：用户通过挂载一个远程设备的方式来访问数据，类似于挂载一个本地的物理硬盘一样（如在Linux下使用 `mount` 命令）。在 **OpenStack** 中，**Compute** 服务中的 **cinder-volume** 服务提供这样的功能，并使用 **iSCSI** 来暴露远程数据以作为一个连接到网络的 **SCSI** 磁盘。

因为数据是以物理设备的形式暴露在外，终端用户负责创建分区和格式化暴露在外的磁盘设备。此外，**OpenStack** 的 **Compute** 中，一个设备在同一时间只能附在一个服务器下，所以块存储不能并发地在多虚拟机之间共享数据。

### 文件存储 (NAS)

在 **OpenStack** 中还没有。

相关概念：NFS，Samba/CIFS，GlusterFS，Dropbox，Google Drive。

在文件存储中，文件通过一个分布式文件系统协议被暴露。文件存储与 **NAS**（网络附加存储）同义。客户端通过操作系统在文件系统级别被访问：用户通过挂载远程文件系统来访问数据。文件存储的例子有 **NFS** 和 **GlusterFS**。操作系统需要安装相应的客户端软件才能访问远程文件系统。

目前来说，**OpenStack** 还没有任何对这种类型的存储的原生支持。不过，这里有一个“[Gluster storage connector for OpenStack](http://gluster.org/community/documentation//index.php/OSConnect)”来启用 **GlusterFS** 文件系统作为 **Image** 服务的一个后端。