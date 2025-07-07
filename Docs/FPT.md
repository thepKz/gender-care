Chắc chắn rồi! Dưới đây là phiên bản chi tiết và mở rộng của tài liệu bạn đã cung cấp. Tôi sẽ bổ sung thêm các giải thích, ví dụ, so sánh và lý do "tại sao" đằng sau mỗi khái niệm để tạo thành một tài liệu toàn diện và dễ hiểu hơn.

***

## Tài Liệu Toàn Diện về Thiết Kế và Kiến trúc Phần Mềm

Tài liệu này cung cấp một cái nhìn sâu sắc và có hệ thống về các nguyên tắc, phương pháp và công cụ cốt lõi trong lĩnh vực thiết kế và kiến trúc phần mềm, từ các khái niệm cơ bản đến các mẫu kiến trúc phức tạp.

### **Phần 1: Giới Thiệu Tổng Quan về Thiết Kế Phần Mềm**

#### **1.1. Thiết kế phần mềm là gì?**

Thiết kế phần mềm là quá trình tư duy, lập kế hoạch và tạo ra một giải pháp có cấu trúc cho một vấn đề phần mềm. Nó không phải là việc viết mã ngay lập tức, mà là giai đoạn xây dựng **"bản thiết kế chi tiết"** cho ứng dụng trước khi bắt tay vào lập trình.

Hãy tưởng tượng việc xây dựng một tòa nhà chọc trời. Không ai bắt đầu bằng cách trộn xi măng và xếp gạch. Họ bắt đầu với bản vẽ của kiến trúc sư, sơ đồ kết cấu của kỹ sư, hệ thống điện, nước... Thiết kế phần mềm cũng tương tự: nó xác định các thành phần (component), mối quan hệ giữa chúng, luồng dữ liệu và cách hệ thống sẽ đáp ứng các yêu cầu đã đề ra. Một thiết kế tốt giúp giảm thiểu rủi ro, tiết kiệm chi phí sửa lỗi sau này và tạo ra một sản phẩm bền vững, dễ bảo trì.

*   **Mô hình hóa (Modeling):** Là quá trình trừu tượng hóa và trực quan hóa một hệ thống phức tạp trước khi xây dựng nó. Thay vì bị lạc trong hàng ngàn dòng mã, chúng ta sử dụng các mô hình (diagrams, specifications) để phân tích, thảo luận và xác thực các ý tưởng thiết kế. Mô hình hóa giúp chúng ta trả lời các câu hỏi quan trọng như "Liệu thiết kế này có đáp ứng được yêu cầu về hiệu năng không?" hay "Các thành phần sẽ tương tác với nhau như thế nào?" từ rất sớm.

*   **Ngôn ngữ Mô hình hóa Hợp nhất (UML - Unified Modeling Language):** Nếu mô hình hóa là hành động "vẽ bản thiết kế", thì UML chính là bộ công cụ và quy tắc để vẽ. Đây là một ngôn ngữ đồ họa chuẩn hóa, cung cấp một bộ từ vựng và cú pháp chung để mọi người (lập trình viên, nhà phân tích, khách hàng) có thể đọc, hiểu và trao đổi về cùng một bản thiết kế mà không bị hiểu nhầm. COMET, một phương pháp thiết kế cụ thể, sử dụng UML làm ký pháp chính để biểu diễn các mô hình của mình. Phiên bản mới nhất được đề cập là 2.5.1 (phát hành tháng 12/2017), cho thấy sự trưởng thành và ổn định của ngôn ngữ này.

#### **1.2. Các khái niệm cốt lõi trong thiết kế**

Để thực hiện thiết kế một cách có hệ thống, chúng ta cần phân biệt các ý tưởng nền tảng sau:

*   **Phương pháp (Method):** Là một quy trình có hệ thống, giống như một "công thức nấu ăn" chi tiết. Nó chỉ dẫn từng bước một cách tuần tự hoặc lặp lại để biến các yêu cầu phần mềm thành một bản thiết kế hoàn chỉnh. Ví dụ: Phương pháp COMET là một phương pháp cụ thể.

*   **Ký pháp (Notation):** Là ngôn ngữ được sử dụng để thể hiện và ghi lại bản thiết kế. Nó có thể là đồ họa (như các biểu đồ UML) hoặc văn bản (như các tài liệu đặc tả). Ký pháp là công cụ để truyền đạt ý tưởng của phương pháp.

*   **Khái niệm (Concept):** Là một ý tưởng hoặc nguyên tắc nền tảng, có thể áp dụng trong nhiều phương pháp và chiến lược khác nhau. Ví dụ, **"che giấu thông tin" (information hiding)** là một khái niệm cốt lõi của lập trình hướng đối tượng, khuyên rằng chi tiết triển khai nội bộ của một module nên được ẩn đi.

*   **Chiến lược (Strategy):** Là một kế hoạch tổng thể, một cách tiếp cận ở mức cao để giải quyết một vấn đề. Ví dụ, **"phân rã hướng đối tượng" (object-oriented decomposition)** là một chiến lược để chia nhỏ một hệ thống phức tạp thành các đối tượng có thể quản lý được.

*   **Tiêu chí cấu trúc (Structuring Criteria):** Là các quy tắc hoặc hướng dẫn cụ thể giúp nhà thiết kế quyết định cách phân rã hệ thống thành các thành phần nhỏ hơn. Ví dụ, "tiêu chí cấu trúc đối tượng" giúp xác định các lớp và đối tượng trong hệ thống, trong khi "tiêu chí cấu trúc thành phần" giúp xác định các component trong kiến trúc.

> **Tóm lại:** Bạn sử dụng một **Chiến lược** (ví dụ: hướng đối tượng), tuân theo một **Phương pháp** (ví dụ: COMET) sử dụng một **Ký pháp** (ví dụ: UML) để áp dụng các **Khái niệm** (ví dụ: che giấu thông tin) và các **Tiêu chí cấu trúc** để tạo ra bản thiết kế.

### **Phần 2: Vòng Đời và Quy Trình Phát Triển Phần Mềm**

Thiết kế không phải là một hoạt động độc lập mà được đặt trong bối cảnh của một quy trình lớn hơn, gọi là vòng đời phát triển phần mềm (Software Development Life Cycle - SDLC).

#### **2.1. Các mô hình vòng đời truyền thống**

*   **Mô hình Thác nước (Waterfall Model):**
    *   **Mô tả:** Đây là mô hình tuần tự và tuyến tính nhất. Mỗi pha (Yêu cầu -> Phân tích -> Thiết kế -> Lập trình -> Kiểm thử -> Triển khai) phải hoàn thành 100% trước khi chuyển sang pha tiếp theo, giống như dòng nước chảy xuống thác.
    *   **Hạn chế:** Mô hình này cứng nhắc và không linh hoạt. Nó giả định rằng tất cả các yêu cầu đã được biết rõ và không thay đổi, điều này hiếm khi đúng trong thực tế. Lỗi được phát hiện muộn (ví dụ: lỗi yêu cầu được tìm thấy ở pha kiểm thử) sẽ tốn rất nhiều chi phí để sửa chữa. Sản phẩm chỉ hoạt động ở giai đoạn cuối, khiến khách hàng không thể đưa ra phản hồi sớm.
    *   **Ứng dụng:** Vẫn có thể phù hợp cho các dự án rất nhỏ, có yêu cầu cực kỳ rõ ràng, ổn định và không có rủi ro về công nghệ.

*   **Tạo mẫu (Prototyping):**
    *   **Tạo mẫu bỏ đi (Throwaway Prototyping):** Mục đích chính là để **học hỏi và làm rõ yêu cầu**. Một bản mẫu đơn giản (thường chỉ có giao diện người dùng) được xây dựng nhanh chóng để cho người dùng tương tác. Dựa trên phản hồi của họ, các yêu cầu sẽ được tinh chỉnh. Sau khi mục tiêu học hỏi đã đạt được, bản mẫu này sẽ bị "vứt đi" và hệ thống thật sẽ được xây dựng lại từ đầu dựa trên hiểu biết mới.
    *   **Tạo mẫu tiến hóa (Evolutionary Prototyping):** Đây là một dạng phát triển tăng dần. Bản mẫu ban đầu không bị vứt đi mà được liên tục cải tiến, thêm thắt chức năng qua nhiều phiên bản để dần dần trở thành hệ thống cuối cùng. Mô hình này đòi hỏi một nền tảng kiến trúc vững chắc ngay từ đầu để tránh việc hệ thống trở nên lộn xộn và khó bảo trì khi phát triển.

*   **Mô hình Xoắn ốc (Spiral Model):**
    *   **Mô tả:** Đây là mô hình lặp lại, kết hợp các yếu tố của tạo mẫu và mô hình thác nước, với trọng tâm cốt lõi là **quản lý rủi ro**.
    *   **Quy trình:** Mỗi vòng lặp của xoắn ốc đại diện cho một pha của dự án và bao gồm 4 bước:
        1.  **Xác định mục tiêu:** Quyết định mục tiêu cho vòng lặp này.
        2.  **Đánh giá và giảm thiểu rủi ro:** Đây là bước quan trọng nhất. Nhóm phát triển xác định các rủi ro lớn nhất (về kỹ thuật, quản lý, yêu cầu) và xây dựng kế hoạch để đối phó với chúng.
        3.  **Phát triển và xác thực:** Xây dựng phiên bản tiếp theo của sản phẩm (có thể là một bản mẫu, một phần của hệ thống).
        4.  **Lập kế hoạch:** Lên kế hoạch cho vòng lặp tiếp theo.
    *   **Ưu điểm:** Rất phù hợp cho các dự án lớn, phức tạp và có nhiều rủi ro.

#### **2.2. Các quy trình hiện đại**

Các quy trình hiện đại thường mang tính lặp lại (iterative), tăng dần (incremental) và linh hoạt (agile).

*   **Quy trình Hợp nhất (Unified Process - UP hay RUP):**
    *   **Đặc điểm:** Đây là một framework quy trình phát triển lặp lại, hướng-use-case, lấy kiến trúc làm trung tâm và quản lý rủi ro. Nó không phải là một quy trình cứng nhắc mà là một bộ khung có thể tùy chỉnh.
    *   **Các pha:**
        1.  **Khởi đầu (Inception):** Trả lời câu hỏi "Dự án này có đáng để làm không?". Mục tiêu là xác định phạm vi, mục tiêu kinh doanh và tính khả thi của dự án.
        2.  **Xây dựng (Elaboration):** Trả lời câu hỏi "Chúng ta có thể xây dựng kiến trúc ổn định không?". Pha này tập trung vào việc phân tích miền vấn đề, xây dựng một kiến trúc nền tảng (executable architecture), và giải quyết các rủi ro kỹ thuật chính.
        3.  **Chuyển giao (Construction):** Trả lời câu hỏi "Chúng ta đang xây dựng sản phẩm". Đây là pha phát triển chính, nơi các tính năng được lập trình và tích hợp thành một sản phẩm hoàn chỉnh.
        4.  **Vận hành (Transition):** Trả lời câu hỏi "Làm sao để đưa sản phẩm đến tay người dùng?". Pha này bao gồm các hoạt động như beta testing, đào tạo người dùng và triển khai sản phẩm.

*   **Phương pháp COMET (Collaborative Object Modeling and Architectural Design Method):**
    *   **Đặc điểm:** COMET là một phương pháp thiết kế phần mềm hiện đại, kết hợp sự chặt chẽ của một quy trình có phương pháp với sự linh hoạt của UML. Nó có thể được xem là một sự cụ thể hóa của RUP.
    *   **Công thức:** **COMET = UML (Ký pháp) + Method (Phương pháp)**.
    *   **Triết lý:** Vòng đời của COMET rất lặp lại và xoay quanh **use case**. Use case là sợi chỉ đỏ kết nối 3 hoạt động chính: Mô hình hóa Yêu cầu (Requirements), Mô hình hóa Phân tích (Analysis) và Mô hình hóa Thiết kế (Design). Bằng cách bắt đầu từ use case, COMET đảm bảo rằng mọi hoạt động phân tích và thiết kế đều có thể truy vết ngược lại một yêu cầu cụ thể của người dùng.

### **Phần 3: Nền Tảng Cốt Lõi - Hướng Đối Tượng và UML**

#### **3.1. Các khái niệm Hướng đối tượng (OO)**

Hướng đối tượng (Object-Oriented) không chỉ là một kỹ thuật lập trình mà là một cách tư duy để mô hình hóa thế giới thực vào trong phần mềm.

*   **Đối tượng (Object) và Lớp (Class):**
    *   Một **Lớp (Class)** là một "bản thiết kế" hoặc "khuôn mẫu". Nó định nghĩa các thuộc tính (dữ liệu) và phương thức (hành vi) chung cho một loại thực thể. Ví dụ: Lớp `Car` định nghĩa rằng tất cả các xe hơi đều có `color` (màu sắc), `maxSpeed` (tốc độ tối đa) và có thể `startEngine()` (khởi động máy), `accelerate()` (tăng tốc).
    *   Một **Đối tượng (Object)** là một "thể hiện" cụ thể của một lớp. Ví dụ: `myRedFerrari` là một đối tượng của lớp `Car`, có `color` là "đỏ". `yourBlueFord` là một đối tượng khác của cùng lớp `Car`.

*   **Che giấu thông tin (Information Hiding) và Đóng gói (Encapsulation):**
    *   Đây là nguyên tắc quan trọng nhất của thiết kế OO. **Che giấu thông tin** quyết định rằng chi tiết triển khai bên trong một đối tượng (ví dụ: động cơ của xe hơi hoạt động như thế nào) nên được ẩn đi. Các đối tượng khác không cần và không nên biết về chúng.
    *   **Đóng gói** là kỹ thuật để thực hiện việc che giấu thông tin. Nó "gói" cả dữ liệu (thuộc tính) và các phương thức xử lý dữ liệu đó vào trong một khối duy nhất là đối tượng.
    *   **Giao diện (Interface)** của đối tượng là phần được "công khai" ra bên ngoài (ví dụ: vô lăng, chân ga, cần số). Các đối tượng khác chỉ tương tác thông qua giao diện này. Lợi ích: Nếu bạn thay đổi động cơ (chi tiết bên trong), miễn là cách điều khiển xe (giao diện) không đổi, người lái xe không cần học lại. Trong phần mềm, điều này giúp hệ thống dễ bảo trì và nâng cấp.

*   **Kế thừa (Inheritance) và Tổng quát hóa/Chuyên biệt hóa (Generalization/Specialization):**
    *   Là cơ chế cho phép một lớp mới (lớp con - subclass) thừa hưởng các thuộc tính và phương thức từ một lớp đã có (lớp cha - superclass).
    *   Đây là mối quan hệ **"LÀ MỘT" (IS-A)**. Ví dụ: `Truck` (Xe tải) LÀ MỘT `Vehicle` (Phương tiện giao thông). `Truck` sẽ tự động có các thuộc tính và phương thức của `Vehicle` (như `speed`, `weight`) và có thể bổ sung thêm các đặc điểm riêng của mình (như `cargoCapacity`).
    *   **Tổng quát hóa** là quá trình đi từ các lớp cụ thể (Truck, Car) để tìm ra một lớp cha chung (Vehicle). **Chuyên biệt hóa** là quá trình ngược lại, tạo ra các lớp con từ một lớp cha.

#### **3.2. Ngôn ngữ UML - Công cụ trực quan hóa**

UML cung cấp một bộ công cụ phong phú để mô tả hệ thống từ nhiều góc độ. Các biểu đồ quan trọng nhất bao gồm:

*   **Góc nhìn chức năng (Functional View):**
    *   **Biểu đồ Use Case (Use Case Diagram):** Trả lời câu hỏi: **"Hệ thống làm gì cho người dùng?"**. Nó mô tả các chức năng chính của hệ thống dưới dạng các "use case" và những "actor" (người dùng hoặc hệ thống khác) tương tác với chúng.

*   **Góc nhìn cấu trúc (Structural/Static View):**
    *   **Biểu đồ Lớp (Class Diagram):** Trả lời câu hỏi: **"Hệ thống được cấu tạo từ những gì?"**. Đây là biểu đồ quan trọng nhất, mô tả cấu trúc tĩnh của hệ thống, bao gồm các lớp, thuộc tính, phương thức và các mối quan hệ giữa chúng.
        *   **Association (Kết hợp):** Mối quan hệ chung giữa các lớp. Ví dụ: một `Student` (Sinh viên) "đăng ký" (enrolls in) một `Course` (Khóa học).
        *   **Aggregation (Tập hợp):** Mối quan hệ "toàn thể/bộ phận" (whole/part) dạng lỏng lẻo. Bộ phận có thể tồn tại độc lập với toàn thể. Ví dụ: một `Department` (Khoa) có nhiều `Professor` (Giáo sư). Nếu khoa bị giải thể, giáo sư vẫn tồn tại.
        *   **Composition (Thành phần):** Dạng quan hệ "toàn thể/bộ phận" mạnh hơn. Bộ phận không thể tồn tại nếu không có toàn thể. Ví dụ: một `Building` (Tòa nhà) bao gồm các `Room` (Phòng). Nếu tòa nhà bị phá hủy, các phòng cũng không còn.
        *   **Generalization (Tổng quát hóa):** Mối quan hệ kế thừa "IS A".

*   **Góc nhìn hành vi (Behavioral/Dynamic View):**
    *   **Biểu đồ Tương tác (Interaction Diagrams):** Trả lời câu hỏi: **"Các đối tượng phối hợp với nhau như thế nào?"**.
        *   **Biểu đồ Tuần tự (Sequence Diagram):** Nhấn mạnh vào **thứ tự thời gian** của các thông điệp được gửi giữa các đối tượng. Rất tốt để thể hiện một kịch bản cụ thể.
        *   **Biểu đồ Giao tiếp (Communication Diagram):** (Còn gọi là Collaboration Diagram trong UML 1.x). Nhấn mạnh vào **mối quan hệ cấu trúc** giữa các đối tượng và các thông điệp chúng trao đổi.
    *   **Biểu đồ Máy trạng thái (State Machine Diagram):** Trả lời câu hỏi: **"Một đối tượng có vòng đời như thế nào?"**. Nó mô tả các trạng thái khác nhau mà một đối tượng có thể có, và các sự kiện gây ra sự chuyển đổi giữa các trạng thái đó. Rất hữu ích cho các đối tượng có hành vi phức tạp, phụ thuộc vào trạng thái (state-dependent).
    *   **Biểu đồ Hoạt động (Activity Diagram):** Trả lời câu hỏi: **"Luồng công việc diễn ra như thế nào?"**. Nó thể hiện các bước tuần tự và song song của một quy trình, rất hữu ích để chi tiết hóa logic bên trong một use case hoặc một phương thức phức tạp.

*   **Góc nhìn triển khai (Physical View):**
    *   **Biểu đồ Triển khai (Deployment Diagram):** Trả lời câu hỏi: **"Phần mềm được cài đặt ở đâu?"**. Nó mô tả cấu hình vật lý của hệ thống, cho thấy các thành phần phần mềm được phân bổ trên các nút phần cứng (servers, devices) như thế nào.

### **Phần 4: Quy Trình Mô Hình Hóa theo COMET**

Phương pháp COMET cung cấp một lộ trình rõ ràng từ yêu cầu đến thiết kế, chia thành 3 hoạt động chính.

#### **4.1. Mô hình hóa Yêu cầu (Requirements Modeling)**

*   **Giai đoạn:** **"CÁI GÌ" (WHAT)**.
*   **Mục tiêu:** Tập trung vào việc hiểu và định nghĩa hệ thống sẽ làm gì từ góc nhìn của người dùng, không quan tâm đến cách nó được thực hiện bên trong. Hệ thống được xem như một **"hộp đen" (black box)**.
*   **Kỹ thuật chính:** Mô hình hóa Use Case.
    1.  **Xác định Actor:** Tìm ra tất cả những ai hoặc những gì sẽ tương tác với hệ thống. Actor có thể là người dùng (Nhân viên ngân hàng), hệ thống bên ngoài (Hệ thống Visa), hoặc thiết bị (Đầu đọc thẻ). Phân biệt Actor chính (người chủ động khởi tạo use case) và Actor phụ (người/hệ thống được use case gọi đến để hỗ trợ).
    2.  **Xác định Use Case:** Với mỗi actor, đặt câu hỏi: "Họ muốn dùng hệ thống để làm gì?". Mỗi use case phải mô tả một chuỗi tương tác hoàn chỉnh và mang lại một kết quả có giá trị cho actor. Tên use case thường có dạng **"Động từ + Bổ ngữ"** (ví dụ: `Rút tiền`, `Kiểm tra số dư`).
    3.  **Tài liệu hóa Use Case:** Mỗi use case được mô tả chi tiết bằng một bản đặc tả, bao gồm: tên, tóm tắt, actors, **điều kiện tiên quyết** (precondition - những gì phải đúng trước khi use case bắt đầu), **điều kiện hậu quyết** (postcondition - kết quả sau khi use case hoàn thành thành công), **luồng chính** (main sequence - các bước của kịch bản thành công), và các **luồng thay thế** (alternative sequences - các kịch bản lỗi hoặc ngoại lệ).
    4.  **Sử dụng Biểu đồ Hoạt động (Activity Diagram):** Khi một use case có luồng sự kiện phức tạp với nhiều nhánh rẽ (if-else), lựa chọn và vòng lặp, biểu đồ hoạt động là một công cụ tuyệt vời để trực quan hóa và làm rõ logic đó.

#### **4.2. Mô hình hóa Phân tích (Analysis Modeling)**

*   **Giai đoạn:** Bắt đầu khám phá **"BÊN TRONG HỘP ĐEN"**.
*   **Mục tiêu:** Chuyển từ việc hiểu *cái gì* sang việc xác định các *đối tượng khái niệm* trong miền vấn đề. Đây là bước đệm quan trọng giữa yêu cầu và thiết kế chi tiết.
*   **Mô hình hóa Tĩnh (Static Modeling) - Tìm các khối xây dựng:**
    *   **Mục tiêu:** Xác định cấu trúc tĩnh của các đối tượng trong miền vấn đề.
    *   **Công cụ:** Biểu đồ Lớp (Class Diagram).
    *   **Hoạt động:**
        *   **Xác định Lớp thực thể (Entity Classes):** Đây là các lớp "danh từ" cốt lõi của hệ thống, thường lưu trữ dữ liệu lâu dài. Ví dụ: trong hệ thống ngân hàng, chúng là `Customer`, `Account`, `Transaction`.
        *   **Xác định các mối quan hệ:** Sử dụng các đường nối Association, Aggregation, Composition, Generalization để thể hiện mối liên kết logic giữa các lớp thực thể này.

*   **Cấu trúc hóa Đối tượng và Lớp (Object and Class Structuring):**
    *   **Mục tiêu:** Phân loại các lớp phần mềm dựa trên vai trò và trách nhiệm của chúng trong ứng dụng. COMET sử dụng các stereotype của UML để làm điều này.
    *   **Các loại lớp (Stereotypes):**
        *   `«boundary»` hoặc `«interface»`: Lớp giao tiếp với thế giới bên ngoài.
            *   `«user interface»`: Giao diện người dùng (ví dụ: màn hình ATM).
            *   `«system interface»`: Giao tiếp với hệ thống khác (ví dụ: lớp proxy kết nối tới hệ thống Visa).
            *   `«device interface»`: Giao tiếp với phần cứng (ví dụ: lớp điều khiển đầu đọc thẻ).
        *   `«control»`: Lớp điều phối, quản lý logic của một use case hoặc một kịch bản phức tạp. Nó không làm công việc thực tế mà chỉ đạo các đối tượng khác làm việc. Ví dụ: lớp `WithdrawalControl` điều phối các bước trong quy trình rút tiền.
        *   `«entity»`: Lớp chứa dữ liệu và logic liên quan đến dữ liệu đó. Đây chính là các lớp thực thể đã xác định ở trên.
        *   `«application logic»`: Lớp chứa các logic nghiệp vụ hoặc thuật toán không thuộc về ba loại trên.
            *   `«business logic»`: Chứa các quy tắc nghiệp vụ.
            *   `«algorithm»`: Đóng gói một thuật toán cụ thể.

*   **Mô hình hóa Động (Dynamic Modeling) - Làm cho các khối xây dựng hoạt động:**
    *   **Mục tiêu:** Mô tả hành vi của hệ thống, cho thấy các đối tượng (đã được phân loại) tương tác với nhau như thế nào để thực hiện một use case.
    *   **Kỹ thuật:**
        *   **Mô hình hóa Tương tác (Interaction Modeling):** Với mỗi use case, tạo một **Biểu đồ Giao tiếp (Communication Diagram)** hoặc Biểu đồ Tuần tự (Sequence Diagram). COMET ưu tiên Biểu đồ Giao tiếp vì nó vừa thể hiện các thông điệp, vừa giữ lại cấu trúc liên kết giữa các đối tượng, giúp dễ dàng hợp nhất thành một Biểu đồ Lớp tổng thể.
        *   **Mô hình hóa Máy trạng thái (State Machine Modeling):** Đối với các đối tượng `«control»` hoặc `«entity»` có hành vi phức tạp, phụ thuộc vào trạng thái (ví dụ: một `Account` có thể ở trạng thái `Open`, `Frozen`, `Closed`), sử dụng Biểu đồ Máy trạng thái để mô hình hóa vòng đời của chúng một cách chính xác.

### **Phần 5: Thiết Kế Kiến Trúc và Chi Tiết**

*   **Giai đoạn:** **"LÀM THẾ NÀO" (HOW)**.
*   **Mục tiêu:** Tổng hợp một giải pháp cụ thể. Ánh xạ mô hình phân tích (lý tưởng hóa) vào một môi trường hoạt động thực tế (với các ràng buộc về công nghệ, hiệu năng, mạng...).

#### **5.1. Tổng quan về Kiến trúc Phần mềm**

*   **Định nghĩa:** Kiến trúc phần mềm là cấu trúc **mức cao (high-level)** của một hệ thống, bao gồm các thành phần phần mềm chính, các thuộc tính bên ngoài của chúng, và các mối quan hệ giữa chúng. Các quyết định kiến trúc là những quyết định **quan trọng nhất và khó thay đổi nhất**, ảnh hưởng sâu sắc đến vòng đời của sản phẩm.
*   **Thành phần (Component):** Một đơn vị phần mềm có thể triển khai, thay thế, có giao diện rõ ràng và đóng gói chức năng bên trong.
*   **Các góc nhìn kiến trúc (Multiple Views):** Một kiến trúc phức tạp không thể được mô tả bằng một biểu đồ duy nhất. Chúng ta cần nhiều góc nhìn:
    *   **Góc nhìn cấu trúc (Structural View):** Hệ thống được chia thành các hệ thống con (subsystem) như thế nào? (Biểu đồ Lớp, Biểu đồ Component).
    *   **Góc nhìn động (Dynamic View):** Các hệ thống con giao tiếp với nhau ra sao? (Biểu đồ Giao tiếp, Biểu đồ Tuần tự).
    *   **Góc nhìn triển khai (Deployment View):** Các hệ thống con được phân bổ trên các máy chủ vật lý như thế nào? (Biểu đồ Triển khai).
*   **Mẫu kiến trúc (Architectural Patterns):** Là các giải pháp đã được kiểm chứng cho các vấn đề thiết kế kiến trúc phổ biến.
    *   **Layers of Abstraction (Các lớp trừu tượng):** Cấu trúc hệ thống thành các lớp xếp chồng. Mỗi lớp chỉ được phép giao tiếp với lớp ngay bên dưới nó. Ví dụ kinh điển: Lớp Trình bày (Presentation Layer), Lớp Nghiệp vụ (Business Layer), Lớp Dữ liệu (Data Access Layer).
    *   **Client/Server:** Phân chia rõ ràng vai trò: client là bên yêu cầu dịch vụ, server là bên cung cấp dịch vụ.
    *   **Broker:** Một thành phần trung gian (broker) điều phối giao tiếp giữa các thành phần khác, giúp chúng không cần biết vị trí hay công nghệ của nhau.

#### **5.2. Thiết kế các loại kiến trúc cụ thể**

**a) Kiến trúc Client/Server (Ví dụ: Hệ thống ATM)**
*   **Mô tả:** Một hoặc nhiều server tập trung quản lý tài nguyên và cung cấp dịch vụ, trong khi nhiều client phân tán gửi yêu cầu đến server.
*   **Thiết kế Server:** Một thách thức lớn là xử lý nhiều yêu cầu từ client cùng lúc.
    *   **Sequential Service:** Một luồng duy nhất xử lý lần lượt từng yêu cầu. Đơn giản nhưng hiệu năng kém, dễ bị tắc nghẽn.
    *   **Concurrent Service:** Tạo ra một luồng (thread) hoặc tiến trình (process) mới cho mỗi yêu cầu của client. Tăng thông lượng đáng kể nhưng phức tạp hơn trong quản lý và đồng bộ hóa.
*   **Middleware:** Một lớp phần mềm trung gian giúp che giấu sự phức tạp của giao tiếp mạng và sự khác biệt giữa các hệ điều hành, cung cấp một API thống nhất cho cả client và server.

**b) Kiến trúc Hướng dịch vụ - Service-Oriented Architecture (SOA) (Ví dụ: Hệ thống thương mại điện tử)**
*   **Định nghĩa:** Một triết lý thiết kế trong đó ứng dụng được xây dựng bằng cách kết hợp các dịch vụ (service) độc lập, có khả năng tương tác với nhau. Mỗi dịch vụ là một đơn vị chức năng nghiệp vụ hoàn chỉnh (ví dụ: `CheckInventoryService`, `PaymentService`).
*   **Nguyên tắc thiết kế dịch vụ:**
    *   **Loose coupling (Kết nối lỏng lẻo):** Các dịch vụ ít phụ thuộc vào nhau nhất có thể.
    *   **Service contract (Hợp đồng dịch vụ):** Giao diện của dịch vụ được định nghĩa rõ ràng, độc lập với nền tảng.
    *   **Autonomy (Tự trị):** Mỗi dịch vụ quản lý logic và dữ liệu của riêng mình.
    *   **Composability (Khả năng kết hợp):** Các dịch vụ có thể được lắp ráp lại để tạo ra các quy trình nghiệp vụ lớn hơn.
*   **Công nghệ hỗ trợ:** Web Services (sử dụng SOAP hoặc REST) là công nghệ phổ biến nhất để triển khai SOA.

**c) Kiến trúc Dựa trên thành phần - Component-Based Architecture (Ví dụ: Hệ thống giám sát khẩn cấp)**
*   **Định nghĩa:** Hệ thống được xây dựng từ các thành phần (component) độc lập, có thể tái sử dụng và thay thế.
*   **Các khái niệm:**
    *   **Component:** Một khối xây dựng phần mềm tự chứa.
    *   **Port (Cổng):** Điểm tương tác trên một component.
    *   **Interface (Giao diện):** Định nghĩa các thao tác tại một port.
        *   **Provided Interface:** Các dịch vụ mà component này *cung cấp* cho bên ngoài.
        *   **Required Interface:** Các dịch vụ mà component này *cần* từ các component khác.
    *   **Connector (Kết nối):** Liên kết một `required interface` của component này với một `provided interface` của component khác.

**d) Kiến trúc Đồng thời và Thời gian thực - Concurrent and Real-Time Architectures**
*   **Định nghĩa:** Hệ thống thời gian thực là hệ thống đồng thời phải đáp ứng các ràng buộc nghiêm ngặt về thời gian (deadline). Ví dụ: hệ thống điều khiển phanh ABS trong xe hơi.
*   **Task (Tác vụ):** Một đơn vị thực thi đồng thời, thường được hiện thực bằng một luồng (thread).
*   **Tiêu chí cấu trúc Task:** Các tác vụ được xác định dựa trên nhu cầu về đồng thời, ví dụ: tác vụ xử lý I/O, tác vụ điều khiển dựa trên trạng thái, tác vụ xử lý tương tác người dùng.
*   **Giao tiếp và Đồng bộ hóa Task:** Đây là thách thức lớn nhất.
    *   **Asynchronous Communication (Giao tiếp bất đồng bộ):** Gửi thông điệp và không cần chờ phản hồi (ví dụ: message queue). Phù hợp cho các tác vụ kết nối lỏng lẻo.
    *   **Synchronous Communication (Giao tiếp đồng bộ):** Gửi thông điệp và chờ phản hồi. Phù hợp cho các tác vụ cần phối hợp chặt chẽ.

#### **5.3. Thiết kế chi tiết các Lớp**

Sau khi kiến trúc tổng thể (macro-level) được xác định, chúng ta đi vào thiết kế chi tiết (micro-level) bên trong từng thành phần/subsystem.

*   **Thiết kế Giao diện Lớp (Class Interface Design):** Định nghĩa tất cả các phương thức public mà một lớp cung cấp, bao gồm tên phương thức, danh sách tham số (kiểu dữ liệu, chiều vào/ra), và giá trị trả về. Đây chính là "hợp đồng" của lớp với thế giới bên ngoài.
*   **Đặc tả Giao diện Lớp (Class Interface Specification - CIS):** Một tài liệu chi tiết mô tả đầy đủ một lớp, bao gồm:
    *   Tên lớp, mô tả mục đích.
    *   Thông tin được che giấu (chi tiết triển khai).
    *   Đặc tả cho từng phương thức public (precondition, postcondition).
    *   Lớp cha, các lớp con (nếu có).

### **Phần 6: Thuộc Tính Chất Lượng Phần Mềm (Quality Attributes)**

Đây là các yêu cầu phi chức năng (non-functional requirements), xác định "hệ thống tốt như thế nào". Chúng không phải là tính năng, mà là đặc tính của hệ thống. **Các thuộc tính chất lượng phải được thiết kế ngay từ đầu trong kiến trúc, không thể "thêm vào" sau này.**

*   **Thuộc tính bên trong (Internal Quality - Quan trọng với nhà phát triển):**
    *   **Modifiability (Khả năng sửa đổi):** Mức độ dễ dàng để thay đổi phần mềm. Kiến trúc module hóa, kết nối lỏng lẻo với các giao diện rõ ràng sẽ tối đa hóa thuộc tính này.
    *   **Testability (Khả năng kiểm thử):** Mức độ dễ dàng để kiểm thử phần mềm. Thiết kế theo thành phần và sử dụng dependency injection giúp tăng khả năng kiểm thử.
    *   **Reusability (Khả năng tái sử dụng):** Mức độ các thành phần có thể được dùng lại trong các hệ thống khác.
    *   **Scalability (Khả năng mở rộng):** Khả năng của hệ thống để xử lý tải tăng lên (thêm người dùng, thêm dữ liệu) một cách hiệu quả. Kiến trúc phân tán, không trạng thái (stateless) thường dễ mở rộng hơn.

*   **Thuộc tính bên ngoài (External Quality - Quan trọng với người dùng và doanh nghiệp):**
    *   **Performance (Hiệu năng):** Thời gian phản hồi của hệ thống và thông lượng (throughput). Các quyết định về thuật toán, cấu trúc dữ liệu, mô hình đồng thời và giao tiếp mạng đều ảnh hưởng đến hiệu năng.
    *   **Security (An ninh):** Khả năng của hệ thống chống lại các cuộc tấn công và truy cập trái phép. An ninh phải được xem xét ở mọi lớp, từ mạng, hệ điều hành đến ứng dụng.
    *   **Availability (Tính sẵn sàng):** Tỷ lệ thời gian hệ thống hoạt động và sẵn sàng phục vụ. Thường được đo bằng "số 9" (ví dụ: 99.999% - "five nines"). Đạt được tính sẵn sàng cao thường đòi hỏi sự dư thừa (redundancy) về phần cứng và phần mềm.
    *   **Usability (Tính khả dụng):** Mức độ dễ dàng để người dùng học, sử dụng và cảm thấy hài lòng với hệ thống. Yêu cầu sự tham gia sớm của người dùng và thiết kế giao diện lấy người dùng làm trung tâm.